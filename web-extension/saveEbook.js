var cssFileName = 'ebook.css';

// ---- the stylesheets the archive carries -------------------------------------
//
// Two kinds of css reach a book, and only one of them is filtered by content.
// What extraction captures is scraped off somebody else's page, and supportedCss
// in extractHtml.js decides which of its declarations are worth carrying. What a
// user writes in the chapter editor is not that: it is theirs, it is meant to
// change how the book looks, and holding it to an allowlist would only mean most
// of what they typed silently did nothing. Nothing they can write in it makes the
// package invalid either - css a reading system does not understand is css it
// ignores.
//
// What this removes is neither of those judgements. It is the ways a stylesheet
// reaches outside the archive, which both kinds can do:
//
//   @import          pulls in another stylesheet, which for a remote address is
//                    a network fetch from inside a file that is supposed to read
//                    offline, and for a local one names a file the archive has
//                    no way to contain.
//   a remote address a background image or a font fetched off the network. EPUB
//                    requires a manifest item referencing a remote resource to
//                    say so (properties="remote-resources"), and this build
//                    makes no such claim about any file it writes - so rather
//                    than have the claim and the content disagree, the reference
//                    goes. Captured css hits this as well: 'list-style'
//                    serializes an absolute url whenever the page gave its
//                    bullets a picture.
//
// url() is not the only way to write the second one, which is why the work is
// done by a tokenizer in cssSanitizer.js rather than by a pattern here. That
// file states the whole rule and why it is that rule; this one only says which
// half of the result it wants.
//
// A url() that is not remote survives that pass, because "../images/photo.jpg"
// from a chapter stylesheet can resolve to a picture the book really does
// contain, and using one as a background is a reasonable thing to want. Whether
// it does resolve is the second question, and archiveCssUrl() below is where the
// build answers it. data: urls stay throughout - they are carried in the file
// rather than fetched.
function sanitizeStylesheet(css, resolveUrl) {
    return sanitizeCssResources(css, resolveUrl ? {resolveUrl: resolveUrl} : null).css;
}

// The one file a stylesheet in this archive can address.
//
// EPUB has no tolerance for the difference between a reference that resolves and
// one that does not: a stylesheet naming a file the package does not contain is
// RSC-007, and one background image is enough to make the whole book fail
// validation. So a local url is not taken on trust. It is looked up among the
// images the build is about to write, in the same shape an <img> src takes - see
// dropMissingImages(), which does this for the markup - and anything that is not
// one of them goes.
//
// What resolves is written back with the prefix that reaches the images folder
// from the file being written, which is not the same string in the two places a
// stylesheet lands: OEBPS/ebook.css is beside images/, OEBPS/style/styleN.css is
// a folder below it. That is why the leading '../' segments are matched loosely
// and then restated rather than checked - a user typing css into the editor is
// naming the picture they can see in the chapter, and they have no way to know
// which of the two files their rule is about to end up in. Getting the prefix
// wrong is the same dangling reference as naming a file that was never there,
// and it is the more likely of the two mistakes.
//
// Every rejected reference is collected rather than counted, because the useful
// thing to say about one is which address it was.
function archiveCssUrl(allImages, imagesPath, dropped) {
    var filenames = Object.create(null);
    allImages.forEach(function(image) {
        filenames[image.filename] = true;
    });
    return function(target) {
        var match = String(target).match(/^(?:\.{1,2}\/)*images\/([^/?#]+)(?:[?#].*)?$/i);
        if (match && filenames[match[1]]) {
            return imagesPath + match[1];
        }
        dropped.push(target);
        return null;
    };
}

// Where images/ is from each of the two files that carry css.
var BOOK_CSS_IMAGES_PATH = 'images/';
var CHAPTER_CSS_IMAGES_PATH = '../images/';

// The stylesheet a chapter is written with: what extraction captured from the
// page, then what the user added in the editor. In that order, so that a rule
// the user writes wins over the scraped one it collides with - which is the
// whole point of being able to write one.
//
// resolveUrl is the build's; the chapter preview calls this without one, since
// nothing it renders is read out of an archive.
function chapterStyleContent(page, resolveUrl) {
    var captured = typeof page.styleFileContent === 'string' ? page.styleFileContent : '';
    var authored = typeof page.customCss === 'string' ? page.customCss : '';
    if (authored.trim() === '') {
        return sanitizeStylesheet(captured, resolveUrl);
    }
    return sanitizeStylesheet(captured === '' ? authored : captured + '\n' + authored,
                              resolveUrl);
}

// Compression is set per file, never globally: OCF requires 'mimetype' to be
// the first entry and STORE-d, so readers can sniff the magic bytes.
var DEFLATED = {compression: 'DEFLATE'};
var STORED = {compression: 'STORE'};

// getFileExtension() only ever returns png/gif/jpeg/svg/webp/''. Of those, only
// svg is text - the rest are already compressed and deflating them just burns
// CPU. '' cannot reach here: dropUntypedImages() removes those first.
function getImageZipOptions(filename) {
    return getFileExtension(filename) === 'svg' ? DEFLATED : STORED;
}

// An image whose type was never resolved has no media type to declare, and a
// manifest item without one is invalid - so the whole book fails over a single
// picture. Extraction drops these at the source now, but chapters buffered by an
// earlier version are still in storage carrying them, so the file and the <img>
// tags pointing at it are removed together here as well. Removing only one of
// the two trades this failure for a dangling reference, which fails just as hard.
function dropUntypedImages(page) {
    var images = page.images || [];
    var usable = images.filter(function(image) {
        return image && typeof image.filename === 'string' &&
               typeof image.data === 'string' && getImageType(image.filename) !== '';
    });
    if (usable.length === images.length) {
        return page;
    }
    var content = String(page.content || '');
    images.forEach(function(image) {
        if (usable.indexOf(image) < 0) {
            var filename = image && image.filename;
            console.log('Dropping an image of unknown type:', filename);
            content = removeImgTags(content, filename);
        }
    });
    // a copy: these pages are the buffered chapters, and rebuilding a book must
    // not quietly edit what is in storage
    return Object.assign({}, page, {images: usable, content: content});
}

// The names the chapter and its stylesheet are written under in the archive.
//
// They are derived here rather than taken from the chapter record, because the
// names in the record are not unique. A stored `url` is minted at extraction
// time as a slug of the page title plus four random digits, and neither half of
// that can be relied on: the slug keeps only [a-z0-9_], so a title in Cyrillic,
// CJK, Greek, Arabic or Hebrew reduces to nothing and the name is the four
// digits alone - a draw from ten thousand values that a fifty-chapter book of
// same-script titles collides on about one time in nine. Two chapters landing
// on one name is not a cosmetic problem: JSZip's file() overwrites, so the
// first chapter's content is gone from the book with nothing reported, and the
// manifest declares the one surviving file twice, which is an invalid package.
// `styleFileName` drew from a larger space and so collided more rarely, with
// the same two consequences when it did.
//
// A chapter's position in the normalized list is unique by construction, so
// that, and not chance, is what separates the names. The slug after it is for
// a person reading the archive; the build never reads meaning back out of it,
// which is why dropping it entirely for a title with no ascii letters is a
// loss of readability and not of correctness. Deriving both names also makes a
// build reproducible - the same chapters produce the same archive - and keeps
// a name that arrived from storage from deciding what path is written to.
function chapterFileName(page, index) {
    var slug = slugifyTitle(page.title);
    return 'ch' + index + (slug ? '-' + slug : '') + '.xhtml';
}

// A chapter whose title is blank is a chapter, not a corrupt record. The build
// used to filter it out with the malformed ones, which meant that clearing a
// title in the editor to retype it and pressing Generate published a book with
// that chapter's content missing and nothing said about it - the row was still
// in the list, the file simply was not in the archive. A title is a label; the
// content is what the chapter is. Naming it here is the same choice the book
// title already makes when its own box is left empty, and it keeps the table of
// contents from carrying an entry with nothing to click on.
//
// The editor asks before it gets this far - see the Generate button in
// chapterEditor.js - so what reaches this fallback is a record from storage that
// no longer has anyone in front of it: one written by an older version, or one
// edited outside the extension.
function chapterTitle(title, index) {
    return typeof title === 'string' && title.trim().length > 0 ?
           title : 'Untitled chapter ' + (index + 1);
}

// Only complete chapter records can become spine items. A null or partially
// written record can be left behind if the browser is closed while storage is
// being updated; skipping that record is preferable to losing every good
// chapter beside it. Optional fields are normalized for chapters saved by older
// extension versions.
function normalizeChapters(allPages) {
    if (!Array.isArray(allPages)) {
        return [];
    }
    return allPages.filter(function(page) {
        // The stored url is read here as evidence that extraction finished
        // writing this record, not as a value the build goes on to use: the name
        // the chapter is written under is minted below.
        return page && typeof page === 'object' &&
               typeof page.url === 'string' && page.url.trim().length > 0;
    }).map(function(page, index) {
        return dropUntypedImages(Object.assign({}, page, {
            title: chapterTitle(page.title, index),
            content: typeof page.content === 'string' ? page.content : '',
            images: Array.isArray(page.images) ? page.images : [],
            // both names are the build's to decide - see chapterFileName()
            url: chapterFileName(page, index),
            styleFileName: 'style' + index + '.css',
            styleFileContent: typeof page.styleFileContent === 'string' ? page.styleFileContent : '',
            // kept beside the captured stylesheet rather than merged into it, so
            // that reopening the editor shows the user what they wrote and not
            // the page's computed styles with their rules buried at the bottom.
            // chapterStyleContent() is where the two become one file.
            customCss: typeof page.customCss === 'string' ? page.customCss : ''
        }));
    }).map(dropMissingImages);
}

// Extraction normally writes every image reference and image byte record as a
// pair. Interrupted downloads and chapters saved by older versions can violate
// that invariant. Remove only local archive references which have no byte
// record; remote-looking sources are left alone for the normal EPUB validation
// path rather than guessed about here.
//
// The reference has to be anchored at the start of the src, not matched
// anywhere in it: a cdn url ending in "/images/photo.jpg" names a file this
// archive was never meant to contain, and stripping that <img> would delete a
// picture rather than repair a dangling reference.
function dropMissingImages(page) {
    var filenames = Object.create(null);
    page.images.forEach(function(image) {
        filenames[image.filename] = true;
    });
    var content = String(page.content || '').replace(/<img\b[^>]*\bsrc="([^"]*)"[^>]*>/gi,
        function(tag, src) {
            var match = src.match(/^(?:\.{1,2}\/)*images\/([^/?#]+)(?:[?#].*)?$/i);
            return match && !filenames[match[1]] ? '' : tag;
        });
    return content === page.content ? page : Object.assign({}, page, {content: content});
}

// The archive has one namespace for images even though chapter records each
// carry their own image list. The same downloaded asset can therefore occur in
// several records. Keep one manifest item and one zip member per filename; all
// chapter references continue to resolve to that shared member.
function collectUniqueImages(allPages) {
    var seen = Object.create(null);
    var images = [];
    allPages.forEach(function(page) {
        page.images.forEach(function(image) {
            if (!seen[image.filename]) {
                seen[image.filename] = true;
                images.push(image);
            }
        });
    });
    return images;
}

chrome.runtime.onMessage.addListener((obj, sender, sendResponse) => {
    if (obj && obj.shortcut === 'build-ebook') {
        // Which background job this build belongs to, carried down through the
        // build rather than kept in a variable of its own: this script is
        // injected once per tab and outlives any one job, so a global would be
        // overwritten by the next build in the same tab while the previous one
        // was still compressing.
        buildEbook(obj.response, null, obj.jobId || null);
        return false;
    }
    if (obj && obj.alert) {
        console.log(obj.alert);
        alert(obj.alert);
        return false;
    }
    // not ours - returning true here would hold the message channel open for
    // every message the other listeners handle
    return false;
})

// Tells the background the job is over, whichever way it ended. Every exit from
// buildEbook() goes through this: without it a failed build leaves the badge on
// and the extension refusing to start anything else until the job times out.
//
// The job is named, so that a build which outlived its own job - reclaimed after
// its heartbeats stopped reaching the background - ends nothing belonging to the
// job that replaced it. A build with no job behind it, which is what the chapter
// editor's Generate button is, ends nobody's.
function finishJob(errorMessage, jobId) {
    if (errorMessage) {
        console.log('Error:', errorMessage);
        try {
            alert(errorMessage);
        } catch (e) {
            console.log('Error:', e);
        }
    }
    try {
        chrome.runtime.sendMessage({type: "done", jobId: jobId || null}, () => {
            void chrome.runtime.lastError;
        });
    } catch (e) {
        console.log('Error:', e);
    }
}

function getImagesIndex(allImages) {
    return allImages.reduce(function(prev, elem, index) {
        return prev + '\n' + '<item href="images/' + escapeXMLChars(elem.filename) +
               '" id="img' + index + '" media-type="image/' + getImageType(elem.filename) + '"/>';
    }, '');
}

// dc:identifier. A book assembled from chapters keeps the id stored beside them
// so that rebuilding after an edit updates the same book in a library instead of
// adding a second copy. A single page saved straight to disk was never stored
// and is a new book every time, so it gets a fresh id.
function getBookId(uuid) {
    return 'urn:uuid:' + (uuid || generateUuid());
}

// dc:source, one per chapter. sourceUrl was added after baseUrl already existed;
// chapters buffered by an older version only carry baseUrl, which points at the
// containing directory rather than the article, but it is the best available
// answer for them and still names the right site.
function getSourceUrl(page) {
    return page.sourceUrl || page.baseUrl || '';
}

// ---- what the user said, and what the pages said -----------------------------
//
// Every metadata field below has three possible answers, in this order: what the
// user typed in the chapter editor, what the page it was extracted from stated,
// and the fallback the build has always used. An override is stored as the user
// typed it - so that reopening the editor shows what was written - which makes
// this the place it becomes a value the package can carry, or nothing at all.
//
// An empty field is not an empty value. It is the absence of an override, and
// what it means is "use what the page said": there is deliberately no way to
// type a blank publisher over one a page stated, because an empty box is what
// every field starts as and it has to mean the same thing then as later.
function trimmedString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeMetadataOverride(raw) {
    let stated = raw && typeof raw === 'object' ? raw : {};
    return {
        // a tag no reader could use is no better than none - see
        // normalizeLanguageTag(), which is what filtered the pages' own
        lang: normalizeLanguageTag(stated.lang),
        authors: (Array.isArray(stated.authors) ? stated.authors : [])
            .map(trimmedString).filter(function(name) { return name !== ''; }),
        publisher: trimmedString(stated.publisher),
        description: trimmedString(stated.description),
        // W3C-DTF or nothing, by the same rule that accepted the pages' dates
        date: normalizeDate(stated.date)
    };
}

// A chapter's metadata: what its page stated, with what the user overrode for
// this chapter alone on top of it. Chapters buffered before the <head> read
// existed have no metadata at all, and a chapter whose page carried none has the
// key but empty values.
//
// The override is the chapter's own record unless a caller names another, which
// is how the editor asks what a chapter would say under an override that is
// still being typed and has not been stored yet.
function getPageMetadata(page, override) {
    let metadata = page.metadata || {};
    let stated = normalizeMetadataOverride(
        override === undefined ? page.metadataOverride : override);
    return {
        // The two validated fields are re-normalized rather than trusted. A
        // chapter buffered by an older build carries whatever that build
        // accepted, and this is the last point before the value is written into
        // a package document that has to validate.
        lang: stated.lang || normalizeLanguageTag(metadata.lang),
        // '' or 'rtl', never 'ltr' - see extractDirection() in extractHtml.js.
        // Not something the editor offers: a page states which way it reads and
        // gets it right, and the field it would sit next to in the panel would
        // be one nobody but a bidirectional reader could answer.
        dir: metadata.dir === 'rtl' ? 'rtl' : '',
        authors: stated.authors.length > 0 ? stated.authors :
                 (Array.isArray(metadata.authors) ? metadata.authors : []),
        publisher: stated.publisher || metadata.publisher || '',
        description: stated.description || metadata.description || '',
        date: stated.date || normalizeDate(metadata.date) || ''
    };
}

// dc:language is required, so there is always an answer: what the user stated
// about the book, else the first chapter that stated a usable one, else the "en"
// this used to hardcode. A book whose chapters disagree still gets a package
// language - each chapter overrides it on its own <html> element, which is what
// a reader actually uses for hyphenation, and a book-level answer does not
// silently reach down and restate every chapter.
function getBookLanguage(allPages, override) {
    let stated = normalizeMetadataOverride(override).lang;
    if (stated) {
        return stated;
    }
    for (let i = 0; i < allPages.length; i++) {
        let lang = getPageMetadata(allPages[i]).lang;
        if (lang) {
            return lang;
        }
    }
    return 'en';
}

// Which way the book reads, as opposed to which way one chapter does. Any right
// to left chapter makes the whole book one, because the page-progression-direction
// this decides is a property of the spine: a book turns its pages one way, and a
// right to left book with an english chapter in it is still a right to left book.
function getBookDirection(allPages) {
    for (let i = 0; i < allPages.length; i++) {
        if (getPageMetadata(allPages[i]).dir === 'rtl') {
            return 'rtl';
        }
    }
    return '';
}

// Written only when it is rtl, which is the only value ever recorded - so a
// chapter that says nothing about direction gets no attribute rather than one
// asserting the default.
function dirAttribute(direction) {
    return direction === 'rtl' ? ' dir="rtl"' : '';
}

function addDistinct(values, picked) {
    (Array.isArray(picked) ? picked : [picked]).forEach(function(value) {
        if (value && values.indexOf(value) < 0) {
            values.push(value);
        }
    });
    return values;
}

// One field gathered across every chapter - the authors of a compilation are
// the authors of its chapters, and so are its publishers.
//
// An override replaces that list rather than joining it. A user who names the
// authors of the book means those authors: merging would leave every byline the
// chapters were scraped from standing beside the ones they wrote, and there
// would be no way to get rid of them.
function collectDistinct(allPages, pick, override) {
    let stated = addDistinct([], override === undefined ? [] : override);
    if (stated.length > 0) {
        return stated;
    }
    let values = [];
    allPages.forEach(function(page) {
        addDistinct(values, pick(getPageMetadata(page)));
    });
    return values;
}

// dc:creator is a list of people, not a wall of them: a compilation of fifty
// articles has fifty bylines, and a package listing all of them is one no
// library shows usefully.
var MAX_BOOK_AUTHORS = 12;

// What the book would say about itself if nobody overrode anything - the values
// the build derives from the chapters in hand. Nothing in the build calls this:
// it is what the editor puts in the metadata boxes as their placeholders, so
// that an empty box visibly means "this is what you get" rather than "this is
// blank". It has to be derived by the functions the build derives it with, or
// the boxes promise something else than what is written.
function deriveBookMetadata(allPages) {
    let pages = normalizeChapters(allPages);
    return {
        lang: getBookLanguage(pages),
        authors: collectDistinct(pages, function(m) { return m.authors; }).slice(0, MAX_BOOK_AUTHORS),
        publisher: collectDistinct(pages, function(m) { return m.publisher; }),
        // one page's blurb and date describe the book; several pages' do not -
        // see where buildEbook() decides the same thing
        description: pages.length === 1 ? getPageMetadata(pages[0]).description : '',
        date: pages.length === 1 ? getPageMetadata(pages[0]).date : ''
    };
}

// Two-word organisation names ("BBC News", "Associated Press") invert into
// nonsense, and a blocklist is the cheapest way to catch the common ones.
var ORG_NAME_WORDS = ['inc', 'llc', 'ltd', 'corp', 'co', 'gmbh', 'bv', 'nv', 'sa', 'ag', 'plc',
    'group', 'team', 'staff', 'news', 'times', 'press', 'media', 'post', 'journal', 'magazine',
    'review', 'daily', 'weekly', 'wire', 'agency', 'network', 'studios', 'labs', 'foundation',
    'institute', 'university', 'editors', 'editorial', 'newsroom', 'desk', 'blog'];

// dc:creator carries a name as it is written; file-as is how a library sorts it,
// and a wrong one misfiles the book permanently. Inverting is only safe for a
// plain two-part latin name: a mononym has nothing to invert, three parts may be
// a particle or a middle name, and most of the world does not put the family name
// last. Everything else gets no file-as and the reader sorts on the name itself,
// which is the correct fallback rather than a degraded one.
function getFileAs(name, publishers) {
    // already in some sorted form, or credited to the site rather than a person
    if (name.indexOf(',') > -1 || publishers.indexOf(name) > -1) {
        return '';
    }
    let parts = name.split(' ');
    if (parts.length !== 2) {
        return '';
    }
    for (let i = 0; i < parts.length; i++) {
        if (!/^[\p{Script=Latin}][\p{Script=Latin}'’.-]*$/u.test(parts[i])) {
            return '';
        }
        if (ORG_NAME_WORDS.indexOf(parts[i].toLowerCase().replace(/[.]$/, '')) > -1) {
            return '';
        }
    }
    return parts[1] + ', ' + parts[0];
}

// dc:creator, with the refinements that make it usable: a role, so a reader knows
// these are authors rather than unspecified contributors, and a display-seq, so a
// byline with several names keeps its order instead of being alphabetised.
function getCreatorsIndex(authors, publishers) {
    return authors.reduce(function(prev, name, index) {
        let escaped = escapeXMLChars(name);
        let entry = '\n' + '<dc:creator id="creator' + index + '">' + escaped + '</dc:creator>' +
                    '\n' + '<meta refines="#creator' + index + '" property="role" scheme="marc:relators">aut</meta>';
        let fileAs = getFileAs(name, publishers);
        if (fileAs) {
            entry += '\n' + '<meta refines="#creator' + index + '" property="file-as">' + escapeXMLChars(fileAs) + '</meta>';
        }
        if (authors.length > 1) {
            entry += '\n' + '<meta refines="#creator' + index + '" property="display-seq">' + (index + 1) + '</meta>';
        }
        return prev + entry;
    }, '');
}

// Counted from the markup that is actually written into the file, not from what
// extraction believed it produced. The metadata below is a claim about this
// epub, so the only honest source for it is this epub.
//
// Three states, and the difference between the last two is the whole point:
//   alt="something"  the source described the image
//   alt=""           the source marked it decorative - also an answer
//   no alt           the source never said, and neither can we
function countImages(allPages) {
    var counts = {total: 0, described: 0, undescribed: 0, animatable: 0};
    allPages.forEach(function(page) {
        var tags = String(page.content || '').match(/<img\b[^>]*>/gi) || [];
        tags.forEach(function(tag) {
            counts.total++;
            var alt = tag.match(/\salt="([^"]*)"/);
            if (!alt) {
                counts.undescribed++;
            } else if (alt[1].length > 0) {
                counts.described++;
            }
        });
        (page.images || []).forEach(function(image) {
            var type = getFileExtension(image.filename);
            if (type === 'gif' || type === 'svg' || type === 'webp') {
                counts.animatable++;
            }
        });
    });
    return counts;
}

// A content document holding MathML has to declare it, or EPUBCheck fails the
// book and several readers never invoke their math handling for that file at
// all. Declaring it on a file with no math is the same error the other way
// round, so it is read from the markup rather than asserted about it - for the
// same reason the image counts above are, and with the same benefit: a chapter
// buffered by a version that predates any of this carries no flag but does carry
// the math.
//
// It is also the only manifest property that can ever apply to a chapter this
// extension writes. "svg" cannot: extraction converts every <svg> into an <img>.
// "scripted" cannot: <script> is stripped along with its content. "remote-
// resources" cannot: every image referenced is one that was downloaded into the
// archive.
function hasMathML(content) {
    return /<math[\s/>]/i.test(String(content || ''));
}

function getChapterProperties(content) {
    return hasMathML(content) ? ' properties="mathml"' : '';
}

// alttext is the formula written out - what a reading system with no MathML of
// its own reads instead of the markup. Pages that ship MathML usually supply it,
// and normalizeMathMl() fills it from the TeX the formula was typeset from when
// they do not, so "every formula has one" is a claim worth checking and making.
function countMath(allPages) {
    var counts = {total: 0, described: 0};
    allPages.forEach(function(page) {
        var tags = String(page.content || '').match(/<math\b[^>]*>/gi) || [];
        tags.forEach(function(tag) {
            counts.total++;
            var alttext = tag.match(/\salttext="([^"]*)"/);
            if (alttext && alttext[1].trim().length > 0) {
                counts.described++;
            }
        });
    });
    return counts;
}

// EPUB Accessibility 1.1 discovery metadata. Every line here is derived from the
// file rather than asserted about it - a hardcoded "alternativeText" on a book
// whose images have no alt is worse than no metadata at all, because it stops a
// reader looking for a book that actually is readable without sight.
//
// dcterms:conformsTo is deliberately absent. It would claim WCAG conformance,
// which covers colour contrast and reflow, and the chapter stylesheets are the
// source sites' own computed colours - not something this extension chooses or
// can check. The summary says so in as many words.
function getAccessibilityIndex(allPages, navTree) {
    var counts = countImages(allPages);
    var math = countMath(allPages);
    var hasImages = counts.total > 0;
    // no image is left unexplained - described or explicitly decorative
    var imagesAccountedFor = counts.undescribed === 0;
    var entries = [];

    function meta(property, value) {
        entries.push('<meta property="' + property + '">' + escapeXMLChars(value) + '</meta>');
    }

    meta('schema:accessMode', 'textual');
    if (hasImages) {
        meta('schema:accessMode', 'visual');
    }

    // "the text alone is enough" holds only when nothing visual is unexplained
    if (imagesAccountedFor) {
        meta('schema:accessModeSufficient', 'textual');
    }
    if (hasImages) {
        meta('schema:accessModeSufficient', 'textual,visual');
    }

    if (counts.described > 0 && imagesAccountedFor) {
        meta('schema:accessibilityFeature', 'alternativeText');
    }
    // toc.xhtml is always generated, with an entry per chapter
    meta('schema:accessibilityFeature', 'tableOfContents');
    // Claimed only when the nav actually goes below chapter level: every book
    // gets a section and a heading per chapter, but "structural navigation"
    // means being able to move around inside one, and that only exists when the
    // source pages had headings to build it from.
    var hasSubEntries = (navTree || []).some(function(node) {
        return node.children.length > 0;
    });
    if (hasSubEntries) {
        meta('schema:accessibilityFeature', 'structuralNavigation');
    }

    // MathML is a feature to search for rather than a hazard to warn about: it
    // is the difference between a formula a screen reader can read out term by
    // term and a picture of one. describedMath is the stronger claim - that
    // there is a text alternative to fall back on - and it only holds when every
    // formula has one.
    if (math.total > 0) {
        meta('schema:accessibilityFeature', 'MathML');
        if (math.described === math.total) {
            meta('schema:accessibilityFeature', 'describedMath');
        }
    }

    // audio and video are dropped by strippedContentTags and the only css that
    // survives is the colour and font allowlist in supportedCss - no animation,
    // no transitions, nothing that can move. What can still move is an animated
    // gif, svg or webp, and there is no way to tell one of those from a still
    // image without decoding it.
    meta('schema:accessibilityHazard', 'noSoundHazard');
    if (counts.animatable === 0) {
        meta('schema:accessibilityHazard', 'noFlashingHazard');
        meta('schema:accessibilityHazard', 'noMotionSimulationHazard');
    }

    var summary = 'Generated from web pages. ';
    if (!hasImages) {
        summary += 'It contains no images, so the text is the whole content. ';
    } else if (imagesAccountedFor) {
        summary += 'Every image carries the alternative text from its source page, ' +
                   'or is marked decorative there. ';
    } else {
        summary += counts.undescribed + ' of its ' + counts.total + ' images ' +
                   (counts.undescribed === 1 ? 'has' : 'have') + ' no alternative text, ' +
                   'because the source pages did not provide any. ';
    }
    if (math.total > 0) {
        summary += math.described === math.total ?
            'Its formulas are MathML, each with a text alternative. ' :
            'Its formulas are MathML. ';
    }
    summary += 'Styling is copied from the source pages and has not been checked for ' +
               'colour contrast, so no WCAG conformance is claimed.';
    meta('schema:accessibilitySummary', summary);

    return '\n' + entries.join('\n');
}

// ---- chapter structure and navigation ---------------------------------------
//
// A chapter is written as <body epub:type="bodymatter"> holding a single
// <section epub:type="chapter" role="doc-chapter">, instead of the bare <div> it
// used to be. Both halves are needed and neither substitutes for the other:
// epub:type is what a reading system reads to know where the body of the book
// begins, and the DPUB-ARIA role is what makes VoiceOver and TalkBack announce a
// chapter rather than an unnamed group.
//
// Only these two semantics are asserted. Anything finer - is this section an
// abstract, an epigraph, a bibliography? - would be a guess about pages this
// extension has never seen, epubcheck validates epub:type against the structural
// semantics vocabulary, and a confidently wrong value is worse for a screen
// reader than no value at all.

// A page that uses headings as layout can have hundreds of them; past this many
// the nav stops being a table of contents and becomes a second copy of the
// chapter.
var MAX_HEADINGS_PER_CHAPTER = 200;
var MAX_NAV_LABEL_LENGTH = 200;

// Headings cannot nest in HTML, and the content has been through parseHTML(), so
// the first matching close tag of the same level is the right one.
var HEADING_REGEX = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi;

// Every id already written into the chapter content, so that a minted one can
// avoid them. The content has been through parseHTML(), so an id attribute is
// always double quoted and its value is always an XML name - see isUsableId() in
// utils.js, which is what put it there.
var ID_ATTR_REGEX = /\sid="([^"]*)"/gi;

function collectIds(content) {
    var ids = Object.create(null);
    var match;
    ID_ATTR_REGEX.lastIndex = 0;
    while ((match = ID_ATTR_REGEX.exec(content)) !== null) {
        ids[match[1]] = true;
    }
    return ids;
}

// The chapter content is already XML, so "<" only ever starts a tag and the text
// of a heading is what is left when the tags are taken out - still escaped, and
// so ready to go straight into the nav without being escaped a second time.
function markupToLabel(markup) {
    var label = String(markup).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (label.length > MAX_NAV_LABEL_LENGTH) {
        // never cut inside an entity - "&am" is not well formed
        label = label.substring(0, MAX_NAV_LABEL_LENGTH).replace(/&[^;]*$/, '').trim() + '…';
    }
    return label;
}

// A heading label and a page title are escaped by different rules - text nodes
// keep their quotes, attribute-safe values do not - so both are decoded before
// they are compared.
function decodeBasicEntities(text) {
    return String(text)
        .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function normalizeForMatch(text) {
    return decodeBasicEntities(text).toLowerCase().replace(/\s+/g, ' ')
        .replace(/^[\s"'“”‘’.,:;!?|-]+/, '').replace(/[\s"'“”‘’.,:;!?|-]+$/, '');
}

// Whether a heading already says what the chapter is called. A page's <title>
// usually carries the site name as well ("Article - Wikipedia") while the
// heading in the page does not, so the first separated segment counts too.
function isTitleHeading(label, title) {
    var heading = normalizeForMatch(label);
    if (!heading) {
        return false;
    }
    if (heading === normalizeForMatch(title)) {
        return true;
    }
    var firstSegment = normalizeForMatch(String(title).split(/\s+[|–—•·:-]\s+/)[0]);
    return firstSegment.length > 0 && heading === firstSegment;
}

// A link the page made to a position inside itself - a footnote marker, a "back
// to top", a cross reference - arrives here as a bare fragment, because that is
// what extraction writes for a same-document href. It only works if the element
// it names is still in the chapter, and plenty are not: the target may have been
// outside the selection, or inside something extraction drops whole.
//
// A fragment pointing at nothing is not a dead link, it is an invalid file -
// epubcheck reports an unresolved fragment as an error - so the href goes and
// the text stays. An <a> with no href is well formed and reads as the words it
// always was.
var FRAGMENT_HREF_REGEX = /<a\s([^>]*?)href="#([^"]*)"([^>]*)>/gi;

function resolveInternalLinks(content, usedIds) {
    return String(content).replace(FRAGMENT_HREF_REGEX,
        function(all, before, id, after) {
            if (usedIds[id]) {
                return all;
            }
            var attrs = (before + after).replace(/\s+/g, ' ').trim();
            return attrs ? '<a ' + attrs + '>' : '<a>';
        });
}

// ---- links between chapters -------------------------------------------------
//
// A link from one saved page to another was written as the absolute url it had
// on the web. Extraction has no choice about that - it resolves every href that
// is not a same-document fragment against the page it came from, and while a
// chapter is being extracted the rest of the book does not exist yet. The result
// is that following a cross reference between two chapters of one book leaves
// the book and opens the website it was made from.
//
// Both ends are known here, so the link can point at the file the other chapter
// was written to instead.

// An href as it stands in the chapter content. Everything has been through
// parseHTML(), so an attribute is always double quoted and its value always
// xml-escaped.
var HREF_ATTR_REGEX = /(<a\s[^>]*?href=")([^"]*)(")/gi;

// The comparable form of a page address: what has to collapse is the spellings a
// browser treats as one document, which are a trailing slash and a fragment.
// "example.com/a", "example.com/a/" and "example.com/a#top" are one page, and
// which of them a chapter recorded depends on what was in the address bar.
//
// The query string is kept. It is decoration on some sites and the only thing
// naming the page on others, and dropping it would merge chapters that are
// genuinely different pages - a worse failure than missing a link.
function chapterUrlKey(url) {
    if (!url) {
        return '';
    }
    try {
        let parsed = new URL(String(url));
        parsed.hash = '';
        return parsed.href.replace(/#$/, '').replace(/\/$/, '');
    } catch (e) {
        // not an absolute url: an href extraction could not resolve, or a chapter
        // stored before sourceUrl existed
        return '';
    }
}

function chaptersByUrl(allPages) {
    let byUrl = Object.create(null);
    allPages.forEach(function(page, index) {
        let key = chapterUrlKey(getSourceUrl(page));
        // The first chapter with an address wins it. The same page saved twice
        // is one link target, and sending every link to whichever copy was added
        // last is a coin toss dressed up as a decision.
        if (key && !(key in byUrl)) {
            byUrl[key] = index;
        }
    });
    return byUrl;
}

// Points links between chapters at the files those chapters are written to.
//
// This runs on the finished outline content, after buildChapterOutline(), for
// the same reason resolveInternalLinks() runs last inside it: a link may address
// a heading whose id is only minted while the outline is built, and one whose
// target never survived extraction at all must not keep its fragment - epubcheck
// reports an unresolved fragment as an error rather than as a broken link.
function linkChapters(allPages, outlines) {
    let byUrl = chaptersByUrl(allPages);
    let idsPerChapter = outlines.map(function(outline) {
        return collectIds(outline.content);
    });
    outlines.forEach(function(outline) {
        outline.content = String(outline.content).replace(HREF_ATTR_REGEX,
            function(all, before, href, after) {
                let value = decodeBasicEntities(href);
                let hash = value.indexOf('#');
                let fragment = hash > -1 ? value.substring(hash + 1) : '';
                let key = chapterUrlKey(hash > -1 ? value.substring(0, hash) : value);
                if (!key || !(key in byUrl)) {
                    return all;
                }
                let target = byUrl[key];
                // Every chapter is written into the same folder, so the other
                // chapter's file name is the whole of the relative link.
                let rewritten = escapeXMLChars(allPages[target].url);
                if (fragment && idsPerChapter[target][fragment]) {
                    rewritten += '#' + escapeXMLChars(fragment);
                }
                return before + rewritten + after;
            });
    });
}

// Gives every heading in a chapter an id and reports what was found, in document
// order. This runs on the content string exactly as it will be written to the
// archive: the ids in the file and the ids the nav points at have to be the same
// ones, and deriving them twice in two places is how those two drift apart.
//
// An id the source already carries is kept - it is what any link inside the page
// points at - unless it is unusable or a duplicate, in which case it is replaced
// rather than left beside a generated one, which would be two id attributes on
// one element and not well-formed XML.
//
// Every id in the chapter is collected before any is minted, not just the ones
// on headings: a page is free to have id="sae-c0-h0" on a paragraph, and a
// minted id landing on top of it would give the chapter two elements with one
// id, which is the one thing an id may not be.
function buildChapterOutline(page, index) {
    var headings = [];
    var content = String(page.content || '');
    var usedIds = collectIds(content);
    // Ids this pass has handed out or confirmed, so that two headings carrying
    // the same id from the page do not both keep it. Extraction already dedupes
    // across the whole chapter, so this only catches content reaching the writer
    // by some other route.
    var claimedIds = Object.create(null);
    // The id says which heading of which chapter it belongs to, which is what
    // makes a nav target readable. A suffix is only added if the page already
    // used that exact name for something else.
    var mintId = function() {
        var base = 'sae-c' + index + '-h' + headings.length;
        var id = base;
        var suffix = 2;
        while (usedIds[id]) {
            id = base + '-' + suffix;
            suffix++;
        }
        return id;
    };

    content = content.replace(HEADING_REGEX,
        function(all, level, attrs, inner) {
            if (headings.length >= MAX_HEADINGS_PER_CHAPTER) {
                return all;
            }
            var label = markupToLabel(inner);
            if (!label) {
                // nothing to show in the nav, so nothing worth linking to
                return all;
            }
            var id = (attrs.match(/\sid="([^"]*)"/i) || [])[1] || '';
            if (id && (!isUsableId(id) || claimedIds[id])) {
                attrs = attrs.replace(/\sid="[^"]*"/i, '');
                id = '';
            }
            if (!id) {
                id = mintId();
                attrs = ' id="' + id + '"' + attrs;
            }
            claimedIds[id] = true;
            usedIds[id] = true;
            headings.push({level: parseInt(level, 10), id: id, label: label});
            return '<h' + level + attrs + '>' + inner + '</h' + level + '>';
        });

    // Links into the chapter are resolved last, against the ids as they finally
    // stand - a heading only just got one, and the target of a link may be an
    // element that never made it out of extraction.
    content = resolveInternalLinks(content, usedIds);

    // A page that opens with a heading naming the page is the common case, and
    // adding our own on top of it prints the title twice and lists it twice in
    // the nav.
    var hasTitleHeading = headings.length > 0 &&
                          isTitleHeading(headings[0].label, page.title || '');
    if (hasTitleHeading) {
        headings = headings.slice(1);
    }

    return {content: content, headings: headings, hasTitleHeading: hasTitleHeading};
}

// The chapter as it is written into the archive. The title used to exist only in
// the package document and the nav - a reader opening the chapter itself saw no
// title anywhere - so it becomes the section's heading when the page does not
// already provide one.
function getChapterBody(page, outline) {
    var heading = outline.hasTitleHeading ? '' :
        '<h1>' + escapeXMLChars(page.title) + '</h1>';
    return '<body epub:type="bodymatter">' +
           '<section epub:type="chapter" role="doc-chapter">' +
           heading +
           outline.content +
           '</section>' +
           '</body>';
}

// Headings, which are a flat list of levels, become the tree they describe. A
// level that skips (h1 then h3) nests rather than being promoted, and a chapter
// that starts at h3 puts those at the top - what matters is relative depth,
// since the absolute levels a page uses are its own layout decision.
function headingsToNavNodes(headings, href) {
    var root = [];
    var stack = [];
    headings.forEach(function(heading) {
        var node = {label: heading.label, href: href + '#' + heading.id, children: []};
        while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
            stack.pop();
        }
        if (stack.length === 0) {
            root.push(node);
        } else {
            stack[stack.length - 1].node.children.push(node);
        }
        stack.push({level: heading.level, node: node});
    });
    return root;
}

// One tree, rendered twice below - as the EPUB 3 nav document and as the EPUB 2
// ncx. Building each from its own walk of the chapters is what lets a reader
// following the ncx see a different book from one following the nav.
function buildNavTree(allPages, outlines) {
    return allPages.map(function(page, index) {
        var href = 'pages/' + page.url;
        return {
            label: escapeXMLChars(page.title),
            href: href,
            children: headingsToNavNodes(outlines[index].headings, href)
        };
    });
}

// Labels are already escaped - see markupToLabel()
function navTreeToList(nodes) {
    if (nodes.length === 0) {
        return '';
    }
    return '<ol>' + nodes.reduce(function(prev, node) {
        return prev + '\n' + '<li><a href="' + node.href + '">' + node.label + '</a>' +
               navTreeToList(node.children) + '</li>';
    }, '') + '</ol>';
}

// playOrder is a single sequence over the whole document, not a per-level one,
// so the counter is threaded through the walk.
function navTreeToNavPoints(nodes, counter) {
    return nodes.reduce(function(prev, node) {
        var order = ++counter.value;
        return prev + '\n' +
            '<navPoint id="navPoint' + order + '" playOrder="' + order + '">' +
            '<navLabel><text>' + node.label + '</text></navLabel>' +
            '<content src="' + node.href + '"/>' +
            navTreeToNavPoints(node.children, counter) +
            '</navPoint>';
    }, '');
}

// dtb:depth must state the deepest level the navMap actually reaches. It was
// hardcoded to 1, which was true only while the nav was one flat entry per page.
function navTreeDepth(nodes) {
    return nodes.reduce(function(deepest, node) {
        return Math.max(deepest, 1 + navTreeDepth(node.children));
    }, 0);
}

// Reads the whole book out of storage and builds it. For a caller that has no
// chapters in hand - everything else passes its own array to buildEbook(), which
// is what keeps a build from racing the storage write that preceded it.
function buildEbookFromStorage() {
    getEbookTitle(function (title) {
        getEbookUuid(function (uuid) {
            getBookCss(function (css) {
                getBookMetadata(function (metadata) {
                    getEbookPages(function (allPages) {
                        buildEbook(allPages,
                                   {title: title, uuid: uuid, css: css, metadata: metadata});
                    });
                })
            })
        })
    })
}

// The one way an ebook is built - the one-shot "save this page" and the editor's
// "generate" differ only in what they pass here. Everything that is not
// derivable from the chapters themselves arrives in bookMeta:
//
//   title  what the book is called. Absent, the first chapter names it, which is
//          the right answer for a single saved page.
//   uuid   dc:identifier. Absent, a fresh one is minted: the one-shot path
//          stored nothing, so it is a new book every time and must not inherit
//          an id from a chapter build - see getBookId().
//   css    the book-wide stylesheet, written by the user in the chapter editor.
//          Absent, ebook.css is written empty, which is what it was for every
//          book built before there was anywhere to type one.
//   metadata what the user stated about the book - authors, language, publisher,
//          description, date. Absent, or absent a field, every one of them is
//          derived from the chapters exactly as it was before there were boxes
//          to state them in.
//
// http://ebooks.stackexchange.com/questions/1183/what-is-the-minimum-required-content-for-a-valid-epub
function buildEbook(allPages, bookMeta, jobId) {
    bookMeta = bookMeta || {};
    var ebookTitle = typeof bookMeta.title === 'string' && bookMeta.title.trim().length > 0 ?
                     bookMeta.title : null;
    allPages = normalizeChapters(allPages);
    if (allPages.length === 0) {
        finishJob('There are no valid chapters to save.', jobId);
        return;
    }
    var allImages = collectUniqueImages(allPages);

    console.log('Prepare Content...');

    var ebookFileName = 'eBook.epub';
    var ebookName = '';

    if (ebookTitle) {
        // ~TODO a pre-processing function to apply escapeXMLChars to all page.titles
        ebookName = escapeXMLChars(ebookTitle);
        ebookFileName = getEbookFileName(removeSpecialChars(ebookTitle)) + '.epub';
    } else {
        ebookName = escapeXMLChars(allPages[0].title);
        ebookFileName = getEbookFileName(removeSpecialChars(allPages[0].title)) + '.epub';
    }

    // One instant for the whole package: dc:date (when this file was made) and
    // dcterms:modified disagreeing by a second reads as two separate events.
    var buildDate = new Date().toISOString().replace(/\.[0-9]+Z/i, 'Z');
    var bookId = getBookId(bookMeta.uuid);
    // What the user stated about the book, if anything. Each field below asks it
    // first and falls back to the chapters, which is what every book built
    // before the editor had a metadata panel did for all of them.
    var bookOverride = normalizeMetadataOverride(bookMeta.metadata);
    var bookLanguage = getBookLanguage(allPages, bookOverride);
    var bookDirection = getBookDirection(allPages);
    var publishers = collectDistinct(allPages, function(m) { return m.publisher; },
                                     bookOverride.publisher);
    var authors = collectDistinct(allPages, function(m) { return m.authors; },
                                  bookOverride.authors).slice(0, MAX_BOOK_AUTHORS);
    // dc:date is the date of publication of this file. For a single saved page
    // that is the article's own date, which is what a library should sort on; a
    // book assembled from several pages was published when it was assembled, and
    // picking one chapter's date to stand for the whole would be a guess - which
    // is exactly the guess a user is entitled to make for their own book, and
    // the only reason the field is offered. Every chapter keeps its own date
    // below regardless.
    var bookDate = bookOverride.date ||
                   (allPages.length === 1 && getPageMetadata(allPages[0]).date) || buildDate;
    // Likewise: one page's blurb describes the book. Several pages' first blurb
    // describes one chapter, and claiming otherwise is worse than saying nothing
    // - unless somebody has written the blurb themselves.
    var bookDescription = bookOverride.description ||
                          (allPages.length === 1 ? getPageMetadata(allPages[0]).description : '');

    // The content as it will be written, with an id on every heading, and the
    // one navigation tree that the nav document, the ncx and the chapter files
    // are all rendered from.
    var outlines = allPages.map(function(page, index) {
        return buildChapterOutline(page, index);
    });
    // once every chapter's ids are final, so a link between two of them can be
    // checked against the ids the archive will really contain
    linkChapters(allPages, outlines);
    var navTree = buildNavTree(allPages, outlines);

    var zip = new JSZip();
    // Must stay first in the archive and uncompressed - do not add DEFLATE here.
    zip.file('mimetype', 'application/epub+zip', STORED);

    var metaInfFolder = zip.folder("META-INF");
    metaInfFolder.file('container.xml',
        '<?xml version="1.0"?>' +
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
        '<rootfiles>' +
        '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
        '</rootfiles>' +
        '</container>',
        DEFLATED
    );


    var oebps = zip.folder("OEBPS");
    oebps.file('toc.xhtml',
        '<?xml version="1.0" encoding="utf-8"?>' +
        // xml:lang is what counts in xhtml, lang is what an epub reader that
        // treats the file as html reads - epub wants both, and both must agree
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"' +
        ' xml:lang="' + bookLanguage + '" lang="' + bookLanguage + '"' +
        dirAttribute(bookDirection) + '>' +
        '<head>' +
        // was the literal string "toc.xhtml", which is what a reader shows in
        // its own table of contents view and in the page's title bar
        '<title>Table of Contents</title>' +
        '<link href="' + cssFileName + '" rel="stylesheet" type="text/css" />' +
        '</head>' +
        // the nav document is not part of the reading order - it is what comes
        // before it
        '<body epub:type="frontmatter">' +
        '<nav id="toc" epub:type="toc" role="doc-toc">' +
        '<h1 class="frontmatter">Table of Contents</h1>' +
        // the nested list the headings describe, not one flat entry per page
        navTreeToList(navTree).replace('<ol>', '<ol class="contents">') +
        '</nav>' +
        // Where the parts of the book are, for the readers that offer "go to the
        // start of the book" and for assistive technology. hidden, because it is
        // machine-readable structure rather than a second table of contents to
        // scroll past.
        //
        // One entry, because a landmark may only point at a spine item and the
        // only structural claim that is certainly true of every book built here
        // is where its body starts. A "toc" landmark pointing at this document
        // is what most books carry, but the nav is not in the spine, and
        // epubcheck rejects it (RSC-011); readers find it through the manifest's
        // nav property instead.
        (navTree.length > 0 ?
            '<nav epub:type="landmarks" hidden="hidden" aria-label="Landmarks">' +
            '<h2>Guide</h2>' +
            '<ol>' +
            '<li><a epub:type="bodymatter" href="' + navTree[0].href + '">Start of Content</a></li>' +
            '</ol>' +
            '</nav>' : '') +
        '</body>' +
        '</html>',
        DEFLATED
    );

    oebps.file('toc.ncx',
        '<?xml version="1.0" encoding="UTF-8" ?>' +
        '<ncx version="2005-1" xml:lang="' + bookLanguage + '" xmlns="http://www.daisy.org/z3986/2005/ncx/">' +
        '<head>' +
        // must be the same value as dc:identifier in the package document
        '<meta name="dtb:uid" content="' + bookId + '"/>' +
        '<meta name="dtb:depth" content="' + Math.max(1, navTreeDepth(navTree)) + '"/>' +
        '</head>' +
        '<docTitle>' +
        '<text>' + ebookName + '</text>' +
        '</docTitle>' +
        // Kept for ADE and Kindle Previewer, which ignore the nav document, and
        // rendered from the same tree so the two cannot disagree.
        '<navMap>' +
        navTreeToNavPoints(navTree, {value: 0}) +
        '</navMap>' +
        '</ncx>',
        DEFLATED
    );

    // The book-wide stylesheet: written by hand in the chapter editor, empty for
    // every book whose author never opened that box. Every chapter links it, and
    // so does the table of contents.
    //
    // Both stylesheets have their local url()s checked against the images this
    // archive is about to hold - see archiveCssUrl() - and both are checked
    // against the same list: OEBPS/images/ is one namespace for the whole book,
    // so a rule in ebook.css may name a picture that arrived with any chapter.
    var droppedCssUrls = [];
    oebps.file(cssFileName,
               sanitizeStylesheet(bookMeta.css,
                                  archiveCssUrl(allImages, BOOK_CSS_IMAGES_PATH,
                                                droppedCssUrls)),
               DEFLATED);
    // One resolver for every chapter stylesheet, because they all land in the
    // same folder and read from the same images.
    var chapterCssUrl = archiveCssUrl(allImages, CHAPTER_CSS_IMAGES_PATH, droppedCssUrls);
    var styleFolder = oebps.folder('style');
    allPages.forEach(function(page) {
        styleFolder.file(page.styleFileName, chapterStyleContent(page, chapterCssUrl),
                         DEFLATED);
    });
    // Said rather than raised. A dropped reference costs a background image and
    // the book is otherwise the one that was asked for, which does not justify
    // stopping a download the user is waiting on - and the alternative to
    // dropping it is a package no reading system will open. Named once each: the
    // same rule copied into every chapter's box is one mistake, not twenty.
    if (droppedCssUrls.length > 0) {
        console.log('Stylesheet references to files this book does not contain, removed: ' +
                    droppedCssUrls.filter(function(url, index) {
                        return droppedCssUrls.indexOf(url) === index;
                    }).join(', '));
    }

    var pagesFolder = oebps.folder('pages');
    allPages.forEach(function(page, index) {
        var tmpPageTitle = escapeXMLChars(page.title);
        // the chapter's own language when its page stated one, so a book mixing
        // languages hyphenates and speaks each chapter correctly
        var pageLanguage = getPageMetadata(page).lang || bookLanguage;
        // The chapter's own direction, with no fall back to the book's: unlike a
        // language, which every chapter states, direction is only ever recorded
        // when it is rtl. Taking the book's would turn the one english chapter of
        // an arabic book right to left as well.
        var pageDirection = getPageMetadata(page).dir;
        pagesFolder.file(page.url,
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"' +
            ' xml:lang="' + pageLanguage + '" lang="' + pageLanguage + '"' +
            dirAttribute(pageDirection) + '>' +
            '<head>' +
            '<title>' + tmpPageTitle+ '</title>' +
            // In this order, and this is the cascade the preview reproduces: the
            // book-wide stylesheet states what the book looks like, the chapter's
            // own - the source page's computed styles, plus whatever the user
            // added for this chapter alone - is the more specific answer and
            // comes second.
            '<link href="../' + cssFileName + '" rel="stylesheet" type="text/css" />' +
            '<link href="../style/' + page.styleFileName + '" rel="stylesheet" type="text/css" />' +
            '</head>' +
            getChapterBody(page, outlines[index]) +
            '</html>',
            DEFLATED
        );
    });

    oebps.file('content.opf',
        '<?xml version="1.0" encoding="UTF-8" ?>' +
        // No prefix attribute: every vocabulary used below - dc:, dcterms:,
        // marc:, schema: - is reserved in EPUB 3.3 and redeclaring one is an
        // error. The a11y: vocabulary is the exception that would need declaring,
        // but all four of its properties are certification and exemption claims,
        // which getAccessibilityIndex() deliberately does not make.
        '<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
        'unique-identifier="db-id" version="3.0">' +
        // dcterms: needs no xmlns here - it is an EPUB reserved prefix, resolved
        // against the package vocabulary, not an XML namespace
        '<metadata>' +
        '<dc:title id="t1">'+ ebookName + '</dc:title>' +
        '<meta refines="#t1" property="title-type">main</meta>' +
        '<dc:identifier id="db-id">' + bookId + '</dc:identifier>' +
        '<meta property="dcterms:modified">' + buildDate + '</meta>' +
        '<dc:date>' + bookDate + '</dc:date>' +
        '<dc:language>' + bookLanguage + '</dc:language>' +
        getCreatorsIndex(authors, publishers) +
        publishers.reduce(function(prev, publisher) {
            return prev + '\n' + '<dc:publisher>' + escapeXMLChars(publisher) + '</dc:publisher>';
        }, '') +
        (bookDescription ? '\n' + '<dc:description>' + escapeXMLChars(bookDescription) + '</dc:description>' : '') +
        getAccessibilityIndex(allPages, navTree) +
        // the pages this was made from. Repeated rather than joined: dc:source
        // is repeatable, and one line per chapter survives being read by a tool
        // that only looks at the first.
        allPages.reduce(function(prev, page) {
            var src = getSourceUrl(page);
            return src ? prev + '\n' + '<dc:source>' + escapeXMLChars(src) + '</dc:source>' : prev;
        }, '') +
        // ...and which chapter came from which, since dc:source above is
        // unordered as far as a reader is concerned
        allPages.reduce(function(prev, page, index) {
            var src = getSourceUrl(page);
            return src ? prev + '\n' +
                '<link rel="dcterms:source" refines="#ebook' + index + '" href="' + escapeXMLChars(src) + '"/>' : prev;
        }, '') +
        // when each chapter was published, which the package-level dc:date can
        // only ever state for a one-chapter book
        allPages.reduce(function(prev, page, index) {
            var date = getPageMetadata(page).date;
            return date ? prev + '\n' +
                '<meta refines="#ebook' + index + '" property="dcterms:created">' + date + '</meta>' : prev;
        }, '') +
        '</metadata>' +
        '<manifest>' +
        '<item id="toc" properties="nav" href="toc.xhtml" media-type="application/xhtml+xml" />' +
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />' +
        '<item id="template_css" href="' + cssFileName + '" media-type="text/css" />' +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + '<item id="ebook' + index + '" href="pages/' + page.url + '"' +
                   // from the content as it is written, not as it arrived - see
                   // getChapterProperties()
                   getChapterProperties(outlines[index].content) +
                   ' media-type="application/xhtml+xml" />';
        }, '') +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + '<item id="style' + index + '" href="style/' + page.styleFileName + '" media-type="text/css" />';
        }, '') +
        getImagesIndex(allImages) +
        '</manifest>' +
        // dir on the chapters is what makes the text of a right to left book read
        // the right way; this is what makes the book itself do it - which way the
        // pages turn, and which end of the progress bar is the start. A reader has
        // no other way to know, and defaults to ltr without it.
        '<spine toc="ncx"' +
        (bookDirection === 'rtl' ? ' page-progression-direction="rtl"' : '') + '>' +
        allPages.reduce(function(prev, page, index) {
            return prev + '\n' + '<itemref idref="ebook' + index + '" />';
        }, '') +
        '</spine>' +
        '</package>',
        DEFLATED
    );

    ///////////////
    try {
        // JSZip.folder() writes a directory entry whether or not anything is put
        // in it, and an empty OEBPS/images/ is an EPUBCheck warning (PKG-014) on
        // every text-only book - which is every reader-mode article without
        // pictures and most plain saves. So the folder is created by the first
        // image actually written: that holds whether the book never had an
        // image or had every one of them dropped for having no media type.
        let imgsFolder = null;
        allImages.forEach(function(tmpImg) {
            // TODO - Must be JSON serializable - see the same comment in extractHtml.js
            let imgOptions = getImageZipOptions(tmpImg.filename)
            if (!imgsFolder) {
                imgsFolder = oebps.folder("images");
            }
            // if (tmpImg.isBinary) {
            //     imgsFolder.file(tmpImg.filename, tmpImg.data, {binary: true, compression: imgOptions.compression})
            // } else {
                imgsFolder.file(tmpImg.filename, tmpImg.data, {base64: true, compression: imgOptions.compression})
            // }
        });
    } catch (error) {
        console.log(error);
    }
    

    // Compressing a large book takes long enough to outlive the job timeout, so
    // keep reporting progress until the file is handed to the download
    let heartbeat = setInterval(function () {
        try {
            chrome.runtime.sendMessage({type: 'job-heartbeat', jobId: jobId || null}, () => {
                void chrome.runtime.lastError;
            });
        } catch (e) {
            console.log('Error:', e);
        }
    }, 5000);

    zip.generateAsync({
            type: "blob",
            mimeType: "application/epub+zip"
        })
        .then(function(content) {
            clearInterval(heartbeat);
            saveEbookToDestination(content, ebookFileName)
                .then(function() {
                    finishJob(null, jobId);
                })
                .catch(function(error) {
                    finishJob('Could not save the eBook: ' + error, jobId);
                });
        })
        .catch(function(error) {
            // out of memory on a very large book, a corrupt image, a revoked
            // blob url - all of them used to leave the job open forever
            clearInterval(heartbeat);
            finishJob('Could not generate the eBook: ' + error, jobId);
        });

}
