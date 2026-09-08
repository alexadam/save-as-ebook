// The shared style matcher, and the css sanitizer it strips imported styles
// with. Plus the utils and destinations libraries needed to save epub files.
// Chrome loads only the single file named by background.service_worker,
// so they have to be pulled in here; Firefox runs the background.scripts list,
// which already names them, and has no importScripts in an event page.
if (typeof importScripts === 'function') {
    importScripts('cssSanitizer.js', 'styleLibrary.js', 'utils.js', 'destinations.js');
}

// Firefox's `chrome` namespace is callback-only - those calls return undefined,
// so anything promise-based has to go through `browser`. Chrome has no
// `browser`, and there `chrome` is promise-based under MV3.
const ext = typeof browser !== 'undefined' ? browser : chrome;

// Every write this file makes goes through these two rather than calling
// chrome.storage.local directly. The API reports a refused write - the quota,
// an unwritable profile, Firefox's storage backend saying no - by setting
// chrome.runtime.lastError inside the callback and in no other way: the callback
// runs either way. A caller that does not read it goes on to tell the user their
// chapter was added when nothing was stored, and they find out when they build
// the book and it is not in it. Reading lastError is also what keeps a genuine
// failure from being logged as an unchecked error.
//
// The error reaches the callback as its first argument - null when the write
// landed - so that every caller has to decide what to say about it. That is the
// point of the wrapper: the failure is impossible to take for success by
// omission.
function storageSet(items, callback) {
    chrome.storage.local.set(items, () => {
        let error = storageError();
        if (callback) {
            callback(error);
        }
    });
}

// Removing is as much a write as storing, and fails the same way: a clear that
// silently did not happen leaves the next save appending to a book the user
// believes they threw away.
function storageRemove(keys, callback) {
    chrome.storage.local.remove(keys, () => {
        let error = storageError();
        if (callback) {
            callback(error);
        }
    });
}

// lastError is a getter that has to be read inside the callback, and read at all
// - an unread one is what the browser logs as "Unchecked runtime.lastError".
// Flattened to a string here because that is what crosses a sendResponse to the
// pages that report it.
function storageError() {
    let error = chrome.runtime.lastError;
    if (!error) {
        return null;
    }
    console.log('Storage write failed:', error.message || error);
    return error.message || 'storage write failed';
}

// What a page asking for a write is answered with. Every setter below returns
// this shape, so a caller can tell a write that happened from one that did not
// without knowing which key it was about.
function writeResponse(error) {
    return error ? {ok: false, error: error} : {ok: true};
}

// The sentence the content script alerts when a write the user asked for did not
// happen. It names the likely cause, because it is one of the few storage
// failures the user can actually do something about.
function storageFailureAlert(what) {
    return what + ' could not be saved: the browser refused to write to this ' +
           "extension's storage, which usually means it is full. Nothing was " +
           'stored - discarding the buffered chapters in the Chapter Editor ' +
           'frees the most space.';
}

///////////////////
///////////////////
///////////////////
///////////////////
/// Only for testing

// MV3: every listener must be registered synchronously on every worker
// startup, so this cannot live inside an onInstalled callback.
let TEST_TIMER = null

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (navigator.userAgent !== 'PuppeteerTestingAgent') {
        return
    }

    if (TEST_TIMER) {
        clearTimeout(TEST_TIMER)
    }

    TEST_TIMER = setTimeout(() => {
        executeCommand({type: 'save-page'})
    }, 2000)
});



///////////////////
///////////////////
///////////////////
///////////////////

// MV3: the service worker is evicted when idle, so the record of the job in
// flight lives in chrome.storage.session (in-memory, survives worker restarts,
// cleared when the browser restarts) instead of a module variable. A pending
// setTimeout would not survive eviction either.
//
// The job is considered gone when its heartbeat stops rather than when a fixed
// deadline passes: a big page can spend well over a minute downloading images,
// and a plain deadline declared it finished while it was still running, so a
// second job could start and interleave with it through the content script's
// globals. The content script pings while it works; a tab that was closed or
// navigated away stops pinging and the job is reclaimed.
const JOB_TIMEOUT = 30000
let jobClaimPending = false

// Injected on demand instead of declared in the manifest. That keeps the
// extension off every page the user visits, and lets it run with activeTab
// alone - a <all_urls> host permission would show a "read and change all your
// data on all websites" warning at install. Order matters: jszip and readability
// before the scripts that use them.
//
// readability.js goes in unconditionally rather than only when the checkbox is
// set. It is one more file the size of jszip, injected into the one tab the user
// acted on, and the alternative - injecting it separately when the setting is on
// - leaves a tab that was injected with the setting off unable to honour it when
// the user turns it on without reloading.
const CONTENT_SCRIPTS = ['libs/jszip.js', 'libs/readability.js', 'utils.js', 'cssSanitizer.js', 'sanitizeHtml.js', 'extractHtml.js', 'destinations.js', 'saveEbook.js']

// The styles that ship with the extension live in styles/catalog.json, read
// through loadStyleCatalog() below. They used to be an array here, which meant a
// new one could only reach a user who had never saved a style of their own.

// Identifies one run of a job to the messages sent about it. It only has to
// tell this job apart from the one before it - these messages come from this
// extension's own content scripts, nothing else can send them - so a counter is
// enough, except that the service worker is torn down between jobs while
// session storage is not, and a counter alone would restart at 1 beside a
// stored record already claiming that number. The clock reading separates the
// runs; the counter separates two jobs started in the same millisecond.
let jobSequence = 0
function nextJobId() {
    jobSequence += 1
    return Date.now() + '-' + jobSequence
}

// Whether two job records are the same run. A record written by a previous
// release carries no jobId; it still has to be recognisable so that the job it
// describes can be cleaned up after an update, so fall back to what it does have.
function isSameJob(a, b) {
    if (!a || !b) {
        return false
    }
    if (a.jobId || b.jobId) {
        return a.jobId === b.jobId
    }
    return a.tabId === b.tabId && a.startedAt === b.startedAt
}

// Whether a message is about this job. Two questions, and both matter:
//
//   the job id, which is what stops a late message from a job that already timed
//   out - the tab is the same, so the tab alone would not tell them apart;
//
//   the sending tab, for a message that came from a content script. Only content
//   scripts carry a sender.tab; the popup and the editor page do not, and neither
//   of those owns a job, which is why a message from one matches nothing that has
//   an id.
//
// A job and a content script left over from a previous release both send no id
// at all, so they match each other while nothing from this release does.
function ownsJob(job, jobId, sender) {
    if (!job) {
        return false
    }
    if ((job.jobId || null) !== (jobId || null)) {
        return false
    }
    if (sender && sender.tab && sender.tab.id != null && job.tabId !== sender.tab.id) {
        return false
    }
    return true
}

// job: {jobId, tabId, startedAt, lastHeartbeat, injectedCss: [css, ...]}
function getJob(callback) {
    chrome.storage.session.get('job', (data) => {
        let job = data && data.job ? data.job : null
        if (job && Date.now() - job.lastHeartbeat >= JOB_TIMEOUT) {
            // stopped reporting - the tab is gone or the extraction died
            finishJob(job, false, () => callback(null))
            return
        }
        callback(job)
    })
}

function isBusy(callback) {
    getJob((job) => callback(!!job))
}

// The id goes to the caller, which passes it to everything that will later
// report about this job - see applyAction and the 'job-heartbeat' / 'done'
// handlers.
function startJob(tabId, callback) {
    let now = Date.now()
    let jobId = nextJobId()
    chrome.storage.session.set({
        'job': {jobId: jobId, tabId: tabId, startedAt: now, lastHeartbeat: now, injectedCss: []}
    }, () => {
        chrome.action.setBadgeBackgroundColor({color: "red"})
        chrome.action.setBadgeText({text: "Busy"})
        if (callback) {
            callback(jobId)
        }
    })
}

// Serializes the read-then-write used to claim a job. Storage operations are
// asynchronous, so without the in-worker reservation two commands arriving in
// the same turn can both observe an empty session store and both start.
function tryStartJob(tabId, callback) {
    if (jobClaimPending) {
        callback(false, null)
        return
    }

    jobClaimPending = true
    getJob((job) => {
        if (job) {
            jobClaimPending = false
            callback(false, null)
            return
        }

        startJob(tabId, (jobId) => {
            jobClaimPending = false
            callback(true, jobId)
        })
    })
}

// Records that the job is still making progress. Only touches the job the
// heartbeat is about: an existence check alone keeps a stray heartbeat from
// resurrecting a finished job, but it would still let a job that timed out
// extend the timeout of the one that replaced it.
function touchJob(jobId, sender) {
    chrome.storage.session.get('job', (data) => {
        let job = data && data.job ? data.job : null
        if (!ownsJob(job, jobId, sender)) {
            return
        }
        job.lastHeartbeat = Date.now()
        chrome.storage.session.set({'job': job})
    })
}

// Records what still has to be undone when the job ends. Scoped the same way:
// the sheets one job inserted must not be written over the record of another,
// which would leave them on the page forever and take that job's own sheets off
// the list that removes them.
function updateJob(jobId, fields, callback) {
    chrome.storage.session.get('job', (data) => {
        if (!ownsJob(data && data.job ? data.job : null, jobId)) {
            if (callback) {
                callback(false)
            }
            return
        }
        chrome.storage.session.set({'job': Object.assign(data.job, fields)}, () => {
            if (callback) {
                callback(true)
            }
        })
    })
}

// The sheets a job put on the page, as a list. A job recorded before the layered
// injection landed can still be in session storage across an extension update,
// and that one holds a single string.
function injectedSheets(injectedCss) {
    if (typeof injectedCss === 'string') {
        return injectedCss === '' ? [] : [injectedCss]
    }
    if (!Array.isArray(injectedCss)) {
        return []
    }
    return injectedCss.filter((css) => typeof css === 'string' && css !== '')
}

// removeCSS matches on the text that was inserted, so each sheet has to be
// taken off with the exact string it went on with.
function removeStyleSheets(tabId, sheets) {
    for (let css of sheets) {
        ext.scripting.removeCSS({
            target: {tabId: tabId},
            css: css
        }).catch(() => {})
    }
}

// Clears a job already read from storage. Keeping cleanup in one place also
// lets getJob dispose of an expired record before a replacement is started.
//
// closePopup is false for a reclaimed job: nothing is waiting on that one any
// more, and the popup that would receive the message is the one that just
// opened and asked whether the extension was busy.
function finishJob(job, closePopup, callback) {
    // Compare-and-remove rather than a bare remove. Between the read that
    // produced this record and this write, the record in storage can already be
    // a later job's: removing that one would clear a live job's badge, strip its
    // stylesheets off the page it is still reading, and close the popup waiting
    // on it. A record that is already gone is still cleaned up after - every
    // step below is idempotent, and the sheets it left have to come off.
    chrome.storage.session.get('job', (data) => {
        let current = data && data.job ? data.job : null
        if (current && !isSameJob(current, job)) {
            if (callback) {
                callback()
            }
            return
        }
        removeJobRecord(job, closePopup, callback)
    })
}

function removeJobRecord(job, closePopup, callback) {
    chrome.storage.session.remove('job', () => {
        chrome.action.setBadgeText({text: ""})

        // the styles the extension injected for this site are the page's problem
        // once the job is over - leaving them applied silently restyles the page
        if (job && job.tabId != null) {
            removeStyleSheets(job.tabId, injectedSheets(job.injectedCss))
        }

        // a service worker has no window handles - chrome.extension.getViews() does
        // not exist here, so ask the popup to close itself. Most of the time no popup
        // is open, which rejects with "Receiving end does not exist" - ignore it.
        if (closePopup) {
            ext.runtime.sendMessage({type: 'popup-close'}).catch(() => {})
        }

        if (callback) {
            callback()
        }
    })
}

// The other message the popup listens for. popup-close is the end of a job, and
// only a job that was started can reach it: a command refused before tryStartJob
// never claims one, so nothing would ever take the spinner down and the popup
// waits on work that is not happening.
//
// The alerts these failures show go through the content script, which is exactly
// what a restricted tab does not have - so on that path this message is the only
// thing the user is told. The reason travels as a key rather than a sentence:
// the popup is the localized surface, and it already has the strings.
//
// Most of the time no popup is open, which rejects with "Receiving end does not
// exist" - ignore it, the same as popup-close.
function reportToPopup(reason) {
    ext.runtime.sendMessage({type: 'popup-failed', reason: reason}).catch(() => {})
}

// The single terminal path - every way a live job can end goes through here.
// Ends the job it is told about and no other: by the time a command's callback
// or a content script's 'done' arrives, the job it belongs to may have timed out
// and been replaced by one that is still working.
function endJob(jobId, sender) {
    chrome.storage.session.get('job', (data) => {
        let job = data && data.job ? data.job : null
        if (!ownsJob(job, jobId, sender)) {
            return
        }
        finishJob(job, true)
    })
}

// A closed tab cannot finish its job or send another heartbeat
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.get('job', (data) => {
        if (data && data.job && data.job.tabId === tabId) {
            finishJob(data.job, true)
        }
    })
})

// Injects the content scripts unless the tab already has them. Re-injecting
// would register a second copy of every message listener, so a tab that answers
// the ping is left alone.
function ensureContentScripts(tabId, callback) {
    chrome.tabs.sendMessage(tabId, {type: 'sae-ping'}, (response) => {
        // no receiver yet - reading lastError keeps it from being logged
        void chrome.runtime.lastError

        if (response && response.ready) {
            callback(true)
            return
        }

        ext.scripting.executeScript({
            target: {tabId: tabId},
            files: CONTENT_SCRIPTS
        }).then(() => {
            callback(true)
        }).catch((error) => {
            // no activeTab grant, a chrome:// page, the web store - all end here
            console.log('Error:', error)
            callback(false)
        })
    })
}

chrome.commands.onCommand.addListener((command) => {
    executeCommand({type: command})
});

function executeCommand(command) {
    chrome.tabs.query({
        currentWindow: true,
        active: true
    }, (tab) => {
        if (!tab || !tab[0]) {
            reportToPopup('no-tab');
            return;
        }
        let tabId = tab[0].id;

        // Injected before the busy check rather than after it: the messages this
        // extension shows the user go through the content script, so a tab
        // without one swallows them. Nothing is injected until the user asks for
        // something, which is the point of dropping the declared content script,
        // and injecting is cheap enough to do for a message.
        ensureContentScripts(tabId, (injected) => {
            if (!injected) {
                // a chrome:// page, the web store, a pdf viewer, or no activeTab
                // grant - there is nowhere to show a message in the page, which
                // is what the alert below would have used. The popup is the
                // extension's own page and is still open, so it is told instead.
                console.log('Save as eBook cannot run in this tab');
                reportToPopup('restricted-tab');
                return;
            }

            tryStartJob(tabId, (started, jobId) => {
                if (!started) {
                    chrome.tabs.sendMessage(tabId, {'alert': 'Work in progress! Please wait until the current eBook is generated!'}, (r) => {
                        void chrome.runtime.lastError;
                    });
                    // no job was claimed, so the running one's finishJob will not
                    // close this popup - and closing it on that job's completion
                    // would be wrong anyway, since this command never ran
                    reportToPopup('busy');
                    return;
                }

                // Everything below is handed the id of the job it was started
                // for, and hands it on to the page. Nothing that reports about
                // this job - a heartbeat, a completion, a callback that arrives
                // after a timeout - can then be mistaken for a report about the
                // next one.
                if (command.type === 'save-page') {
                    dispatch(tab, 'extract-page', false, [], jobId);
                } else if (command.type === 'save-selection') {
                    dispatch(tab, 'extract-selection', false, [], jobId);
                } else if (command.type === 'add-page') {
                    dispatch(tab, 'extract-page', true, [], jobId);
                } else if (command.type === 'add-selection') {
                    dispatch(tab, 'extract-selection', true, [], jobId);
                } else if (command.type === 'style-snapshot') {
                    dispatchStyleSnapshot(tab, jobId);
                } else {
                    endJob(jobId);
                }
            })
        })
    });
}

// A save starts a new book, but nothing is discarded here. The book the user has
// buffered is only replaced once a capture has actually produced a chapter to
// replace it with - see the !justAddToBuffer branches of applyAction below. The
// extraction still has three ways to end with nothing (the tab refuses the
// content script, the extraction is interrupted, the selection is empty), and
// clearing on the way in made every one of them destroy a book for a command
// that never ran.
function dispatch(tab, action, justAddToBuffer, appliedStyles, jobId) {
    isIncludeStyles((result) => {
        let isIncludeStyle = result.includeStyle
        isReaderMode((readerResult) => {
            isReviewBeforeSaving((reviewResult) => {
                prepareStyles(tab, appliedStyles, jobId, (tmpAppliedStyles) => {
                    applyAction(tab, action, justAddToBuffer, isIncludeStyle, tmpAppliedStyles,
                        readerResult.readerMode, reviewResult.reviewBeforeSaving, jobId)
                })
            })
        })
    })
}

// "Style this page ..." in the popup: a capture of the page in front of the user
// that is kept for the library to render, and never becomes a chapter.
//
// It is the same extraction the commands run - which is the point, since what the
// library previews has to be what a capture would produce - with three
// deliberate differences:
//
//   No site style is injected first. The snapshot has to hold what an enabled
//   style hides, or switching that style off in the library would have nothing to
//   show; the styles are applied to the rendering instead, where they can be
//   changed without capturing the page again.
//
//   Reader mode is off, whatever the checkbox says. A style is written against
//   the page, and Readability hands back an article that is no longer it.
//
//   styleSnapshot, which keeps the page's own class names on the markup - see
//   extractionSanitizeOptions(). Nothing else has any use for them.
//
// The buffered chapters are not touched: styling a page is not saving one.
function dispatchStyleSnapshot(tab, jobId) {
    isIncludeStyles((result) => {
        chrome.tabs.sendMessage(tab[0].id, {
            type: 'extract-page',
            includeStyle: result.includeStyle,
            appliedStyles: [],
            readerMode: false,
            styleSnapshot: true,
            jobId: jobId
        }, (response) => {
            void chrome.runtime.lastError;

            if (!response || !response.content || response.content.trim() === '') {
                endJob(jobId)
                chrome.tabs.sendMessage(tab[0].id,
                    {'alert': 'Save as eBook could not read this page to style it!'}, (r) => {
                    void chrome.runtime.lastError;
                });
                return;
            }

            storeStyleSnapshot({
                url: tab[0].url || '',
                title: response.title || '',
                capturedAt: Date.now(),
                page: response
            }, (error) => {
                endJob(jobId)
                // The library page renders the snapshot it is opened on. Opening
                // it after a write that did not happen shows the previous
                // capture, or none, under a heading saying this page was
                // captured - so the failure is said here and the tab is not
                // opened at all.
                if (error) {
                    chrome.tabs.sendMessage(tab[0].id,
                        {'alert': storageFailureAlert('The captured page')}, (r) => {
                        void chrome.runtime.lastError;
                    });
                    return;
                }
                chrome.tabs.create({url: chrome.runtime.getURL(styleLibraryUrl(tab[0].url))})
            })
        });
    })
}

// The library page, told which page it is being opened about. Same query
// parameter the popup's "Edit Site Styles" uses - see the note in menu.js on why
// the url is handed over rather than looked up.
function styleLibraryUrl(url) {
    return 'styles.html' + (url ? '?for=' + encodeURIComponent(url) : '');
}

// One snapshot at a time, replaced rather than accumulated: it holds a page's
// images as base64 and there is only one preview pane to render it in. Kept out
// of clearEbook's list on purpose - it belongs to the styles, which outlive any
// one book.
function storeStyleSnapshot(snapshot, callback) {
    storageSet({'styleSnapshot': snapshot}, callback)
}

function isIncludeStyles(callback) {
    chrome.storage.local.get('includeStyle', (data) => {
        if (!data) {
            callback({includeStyle: false});
        } else {
            callback({includeStyle: data.includeStyle});
        }
    });
}

function isReaderMode(callback) {
    chrome.storage.local.get('readerMode', (data) => {
        if (!data) {
            callback({readerMode: false});
        } else {
            callback({readerMode: data.readerMode});
        }
    });
}

// Whether Save Page and Save Selection stop at the chapter editor instead of
// downloading. Off unless somebody turned it on, so the two commands keep doing
// what their labels have always said they do.
function isReviewBeforeSaving(callback) {
    chrome.storage.local.get('reviewBeforeSaving', (data) => {
        if (!data) {
            callback({reviewBeforeSaving: false});
        } else {
            callback({reviewBeforeSaving: data.reviewBeforeSaving});
        }
    });
}

// The bundled catalog, read from styles/catalog.json once per worker start and
// kept for as long as the worker lives. It is a file that ships with the
// extension, so it cannot change while it is cached, and the read is behind
// every style the capture path applies - doing it once matters.
//
// Callers that arrive while the first read is in flight are queued rather than
// starting a read of their own: two captures at once would otherwise both fetch
// and both migrate.
let styleCatalog = null;
let styleCatalogWaiting = null;

function loadStyleCatalog(callback) {
    if (styleCatalog) {
        callback(styleCatalog)
        return
    }
    if (styleCatalogWaiting) {
        styleCatalogWaiting.push(callback)
        return
    }

    styleCatalogWaiting = [callback];
    // `keep` is what separates a file that was read from one that was not: only
    // the first is cached, so a read that failed is tried again on the next call
    // rather than leaving the worker with no bundled styles until it restarts.
    let finish = (catalog, keep) => {
        if (keep) {
            styleCatalog = catalog;
        }
        let waiting = styleCatalogWaiting;
        styleCatalogWaiting = null;
        for (let waiter of waiting) {
            waiter(catalog)
        }
    };

    fetch(chrome.runtime.getURL('styles/catalog.json'))
        .then((response) => response.json())
        .then((catalog) => {
            let usable = catalog && typeof catalog === 'object';
            finish(usable ? catalog : {entries: []}, usable)
        })
        .catch(() => {
            // A catalog that cannot be read is an empty one for now: the bundled
            // styles are missing for this call, and the user's own are untouched.
            // Storing that emptiness would be worse - the merge would read it as
            // "this release ships no styles" and leave nothing behind.
            finish({entries: []}, false)
        });
}

// The style library: what is stored, migrated from the v1 'styles' array the
// first time it is read, with the bundled catalog laid over it. The v1 key is
// deliberately left where it is: a user who has to go back to the previous
// release still finds their styles in it.
//
// The merge happens on every read rather than once at install, because that is
// what makes the catalog a tier instead of a seed: a style added in a later
// release appears, one the user has edited stays edited, and one they deleted
// stays deleted.
function getStyleLibrary(callback) {
    loadStyleCatalog((catalog) => {
        chrome.storage.local.get(['styleLibrary', 'styles'], (data) => {
            let migrated = migrateStyleLibrary(
                data ? data.styleLibrary : null,
                data ? data.styles : null,
                catalogToV1Builtins(catalog));
            let merged = mergeCatalogIntoLibrary(migrated.library, catalog);

            // The catalog goes to the caller as well as into the merge: the
            // library page needs it to say what a fork can be reset to, and
            // asking for it separately would be a second read of the same file.
            if (!migrated.changed && !merged.changed) {
                callback(merged.library, catalog)
                return
            }

            // The merge is handed over whether or not it could be stored: this
            // is a read, and the caller asked for the library rather than for a
            // migration. A write that failed only means the same merge runs
            // again on the next read - storageSet has logged it.
            storageSet({'styleLibrary': merged.library}, () => {
                callback(merged.library, catalog)
            });
        });
    });
}

function setStyleLibrary(library, callback) {
    storageSet({'styleLibrary': library}, callback);
}

// Puts the selected styles on the page in the order selectStylesForUrl returned
// them in. One insertCSS at a time, and the next only after the last resolved:
// the sheets are a cascade, and issued together they would land in whatever
// order they happened to finish in, which is the opposite of a rule.
function insertStyleSheets(tabId, styles, appliedStyles, jobId, callback) {
    let inserted = [];

    let finish = () => {
        if (inserted.length === 0) {
            callback(appliedStyles)
            return
        }

        // remembered so endJob() can take them off the page again
        updateJob(jobId, {injectedCss: inserted.map((style) => style.css)}, (updated) => {
            if (updated) {
                for (let style of inserted) {
                    appliedStyles.push(style);
                }
            } else {
                // The tab or a timeout ended the job while CSS was being
                // inserted, so there is no later endJob to clean it up.
                removeStyleSheets(tabId, inserted.map((style) => style.css));
            }
            callback(appliedStyles)
        });
    };

    let step = (index) => {
        if (index >= styles.length) {
            finish()
            return
        }
        ext.scripting.insertCSS({
            target: {tabId: tabId},
            css: styles[index].css
        }).then(() => {
            inserted.push(styles[index]);
            step(index + 1)
        }).catch(() => {
            // one sheet the tab refused is no reason to drop the rest
            step(index + 1)
        });
    };

    step(0);
}

// The styles for this capture, on the page before it is read.
//
// This does not ask whether the includeStyle checkbox - "Keep the page's colours
// and fonts" in the popup - is on. Most of what a style does is
// hide something, and hiding is not styling: an element with no box is not
// extracted at all - see readVisibilityAndCss - so a preset that takes the cookie
// banner, the ad slots and the comment thread off a page is doing the same work
// whether or not the page's own css is being carried into the book. Gating it on
// the checkbox meant the cleanest capture the extension can make, plain semantic
// markup with the web chrome removed, was the one combination it refused.
//
// What the checkbox still decides is what happens to the css: with it on the book
// gets the computed style of what survived, with it off it gets these sheets and
// nothing else.
function prepareStyles(tab, appliedStyles, jobId, callback) {
    getStyleLibrary((library) => {
        let styles = selectStylesForUrl(tab[0].url, library);

        if (styles.length === 0) {
            callback(appliedStyles)
            return
        }

        insertStyleSheets(tab[0].id, styles, appliedStyles, jobId, callback);
    });
}

// Save Page and Save Selection with "review before saving" turned on. The
// extraction goes into the same buffer a chapter goes into and the editor is
// opened on it, so that the one-shot commands get the preview, the metadata
// boxes and the stylesheet the chapter path already has. Nothing is downloaded
// here - the editor's own Generate button builds the file.
//
// This is the whole book, not an addition to one: the buffer, the title and the
// identifier of the previous book are discarded here, which is what keeps a
// saved page a new book every time even though it is now stored on the way out -
// the rule getBookId() in saveEbook.js states.
//
// The discarding happens here, at the write, rather than when the command
// started. That is the whole point: by now there is a chapter in hand, so the
// clearing and the replacement are one step and no failed capture can leave the
// user with an emptied book. clearEbook's callback runs with the last key
// already gone, so this write cannot be caught by a removal still in flight.
//
// The page names the book, because that is what the immediate build would have
// called the file. An untitled page is left to the editor's own 'eBook'
// fallback rather than stored as an empty title.
function openForReview(tab, response, jobId) {
    let book = {'allPages': [response]};
    if (response.title && response.title.trim() !== '') {
        book.title = response.title;
    }
    clearEbook(() => {
        storageSet(book, (error) => {
            endJob(jobId)
            // The editor is opened on what is in storage, so a write that did
            // not happen would open it on an empty book with nothing to say why
            // - the chapter is gone either way, and the difference between the
            // two is whether the user knows it. Said in the page, since the tab
            // the capture came from is still the one in front of them.
            if (error) {
                chrome.tabs.sendMessage(tab[0].id,
                    {'alert': storageFailureAlert('The captured page')}, (r) => {
                    void chrome.runtime.lastError;
                });
                return;
            }
            chrome.tabs.create({url: chrome.runtime.getURL('chapters.html')})
        })
    })
}

// Appends one extracted page to the chapters already buffered.
//
// The buffer is read into a local rather than written back through the object
// storage handed over: the guard here used to be `if (!data || !data.allPages)
// { data.allPages = [] }`, which throws on the very null it claims to defend
// against. Nothing produces that null today, but a stored value of the wrong
// shape - a book written by an older release, a profile edited by hand - would
// take the same path, and a chapter is not worth an exception.
//
// The alert says which of the two happened. It is the whole point of the
// wrapper: the callback runs on a refused write exactly as it does on a stored
// one, and the sentence that used to be sent from it said the chapter was added.
function addChapter(tab, response, jobId) {
    chrome.storage.local.get('allPages', (data) => {
        let allPages = data && Array.isArray(data.allPages) ? data.allPages : [];
        allPages.push(response);
        storageSet({'allPages': allPages}, (error) => {
            endJob(jobId)
            chrome.tabs.sendMessage(tab[0].id, {'alert': error ?
                storageFailureAlert('The chapter') :
                'Page or selection added as chapter!'}, (r) => {
                void chrome.runtime.lastError;
            });
        });
    })
}

// The warning text for the images extraction had to leave behind, or null when
// nothing was lost. Split out from applyAction so the wording is testable
// without driving a whole capture through the harness.
//
// The two reasons are worth separating: a failed download is almost always a
// cross-origin image server that serves no Access-Control-Allow-Origin header -
// the page renders it because loading an <img> is not a fetch, and the extension
// asks for no host permissions, so nothing about it is fixable from the page's
// side. An unusable type is the extension's own limit, not the server's.
function describeDroppedImages(droppedImages) {
    if (!Array.isArray(droppedImages) || droppedImages.length === 0) {
        return null;
    }
    let count = droppedImages.length;
    let noun = count === 1 ? '1 image' : count + ' images';
    let blocked = droppedImages.filter((image) => !image || image.reason !== 'type').length;
    let why = blocked === count ? ' The image server did not allow the download.' :
              blocked > 0 ? ' Some were not allowed by the image server, the rest are in a format this extension cannot store.' :
              ' They are in a format this extension cannot store.';
    return noun + ' could not be downloaded and ' + (count === 1 ? 'was' : 'were') +
           ' left out of the chapter.' + why + ' Everything else on the page was saved.';
}

function applyAction(tab, action, justAddToBuffer, includeStyle, appliedStyles, readerMode,
                     reviewBeforeSaving, jobId) {
    chrome.tabs.sendMessage(tab[0].id, {
        type: action,
        includeStyle: includeStyle,
        appliedStyles: appliedStyles,
        // Save Page and Add Page as Chapter only. A selection is the user having
        // already said what the content is, so there is nothing to distil and
        // nothing the checkbox should quietly do to it.
        readerMode: !!readerMode && action === 'extract-page',
        // What the page quotes back in every heartbeat and in the 'done' that
        // ends this job
        jobId: jobId
    }, (response) => {
        // the content script can go away mid-extraction - a navigation tears it
        // down and the callback fires with no response and lastError set
        void chrome.runtime.lastError;

        if (!response) {
            endJob(jobId)
            chrome.tabs.sendMessage(tab[0].id, {'alert': 'Save as eBook does not work on this web site!'}, (r) => {
                void chrome.runtime.lastError;
            });
            return;
        }

        if (!response.content || response.content.trim() === '') {
            endJob(jobId)
            if (justAddToBuffer) {
                chrome.tabs.sendMessage(tab[0].id, {'alert': 'Cannot add an empty selection as chapter!'}, (r) => {});
            } else {
                chrome.tabs.sendMessage(tab[0].id, {'alert': 'Cannot generate the eBook from an empty selection!'}, (r) => {});
            }
            return;
        }
        // The page was still saved, in full - see the fallback in extractHtml.js.
        // Reported rather than swallowed: a distiller is a heuristic, and a user
        // who is not told will read a full page save as the checkbox being broken.
        if (response.readerModeFailed) {
            chrome.tabs.sendMessage(tab[0].id, {'alert': 'Readability.js found no article on this page - the whole page was saved instead.'}, (r) => {
                void chrome.runtime.lastError;
            });
        }
        // Same contract as the reader mode fallback above: the chapter is kept,
        // and the user is told what it cost. Extraction removes an <img> whose
        // bytes never arrived because a reference to a file that is not in the
        // archive fails the whole book - but a picture that is on the page and
        // not in the chapter is indistinguishable from one the page never had,
        // so the removal has to be said out loud.
        let droppedImagesAlert = describeDroppedImages(response.droppedImages);
        if (droppedImagesAlert) {
            chrome.tabs.sendMessage(tab[0].id, {'alert': droppedImagesAlert}, (r) => {
                void chrome.runtime.lastError;
            });
        }
        if (justAddToBuffer) {
            addChapter(tab, response, jobId);
        } else if (reviewBeforeSaving) {
            openForReview(tab, response, jobId);
        } else {
            // The one-shot save: the extraction succeeded, so this is where the
            // previous book goes. The build itself reads nothing from storage -
            // it is handed the chapter directly - so the clearing is here to
            // make the *next* command start from an empty book, which is the
            // documented meaning of Save Page.
            //
            // the job stays open until the content script reports 'done' - it
            // still has to build and download the zip
            //
            // A clear that was refused is logged and not otherwise reported: the
            // book the user asked for is built and downloaded from the chapter
            // in hand either way, and all a failure costs is that the next
            // command starts from the old buffer instead of an empty one. That
            // is not worth an alert on top of a save that worked.
            clearEbook(() => {
                chrome.tabs.sendMessage(tab[0].id, {'shortcut': 'build-ebook', response: [response], jobId: jobId}, (r) => {
                    void chrome.runtime.lastError;
                });
            })
        }
    });
}

// Discards the book being assembled: the chapters and everything written about
// them. One remove call, so the callback runs with the last key already gone -
// a caller that clears the book and immediately writes a new one must not have
// its first chapter removed by a clearing that was still in flight.
function clearEbook(callback) {
    storageRemove([
        'allPages',
        'title',
        // the identifier belongs to the discarded set of chapters - the next
        // ebook is a different book and must not reuse it
        'uuid',
        // and so does the stylesheet written for them. The style library is not
        // touched: those styles belong to the sites, not to this book.
        'bookCss',
        // ...and what the user said the book was called by, written about the
        // chapters that are going
        'bookMetadata'
    ], callback)
}

chrome.runtime.onMessage.addListener(_execRequest);

// Every branch answers, and the ones that answer from a storage callback are the
// only ones that return true. A listener that returns true without ever calling
// sendResponse leaves the sender's callback pending until the channel is torn
// down, which is what Chrome reports as "a listener indicated an asynchronous
// response ... but the message channel closed" - and every setter below is
// called with a callback somewhere (see utils.js).
function _execRequest(request, sender, sendResponse) {
    if (request.type === 'get') {
        chrome.storage.local.get('allPages', function (data) {
            if (!data || !data.allPages) {
                sendResponse({allPages: []});
                return;
            }
            sendResponse({allPages: data.allPages});
        })
        return true;
    }
    // Every setter below answers writeResponse(), which is {ok: true} only when
    // the write actually landed. The pages that call them show what they are
    // told - see the storage-failure paths in chapterEditor.js and cssEditor.js -
    // so an answer of {ok: true} on a refused write is the same lie as an alert
    // saying the chapter was added, one layer further out.
    if (request.type === 'set') {
        storageSet({'allPages': request.pages}, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    if (request.type === 'remove') {
        clearEbook(function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // Minted on first use and kept until the ebook is discarded, so rebuilding
    // after editing chapters produces the same dc:identifier. The service worker
    // is always a secure context, so randomUUID() is available here.
    if (request.type === 'get uuid') {
        chrome.storage.local.get('uuid', function (data) {
            if (data && data.uuid) {
                sendResponse({uuid: data.uuid});
                return;
            }
            let uuid = crypto.randomUUID();
            // The identifier is answered even when it could not be stored. The
            // build needs one and this one is as good as any; what a failed
            // write costs is only that a rebuild of the same chapters mints
            // another, which is not worth refusing to build a book over. It is
            // logged in storageSet.
            storageSet({'uuid': uuid}, function () {
                sendResponse({uuid: uuid});
            });
        })
        return true;
    }
    if (request.type === 'get title') {
        chrome.storage.local.get('title', function (data) {
            if (!data || !data.title || data.title.trim().length === 0) {
                sendResponse({title: 'eBook'});
            } else {
                sendResponse({title: data.title});
            }
        })
        return true;
    }
    if (request.type === 'set title') {
        storageSet({'title': request.title}, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // The book-wide stylesheet. Empty until somebody writes one, which is what
    // every book built before the editor had a box for it had.
    if (request.type === 'get book css') {
        chrome.storage.local.get('bookCss', function (data) {
            sendResponse({css: data && typeof data.bookCss === 'string' ? data.bookCss : ''});
        })
        return true;
    }
    if (request.type === 'set book css') {
        storageSet({
            'bookCss': typeof request.css === 'string' ? request.css : ''
        }, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // What the user stated about the book itself - authors, language, publisher,
    // description, date. Absent until somebody fills a box in, which is what
    // every book built before the editor had those boxes had.
    if (request.type === 'get book metadata') {
        chrome.storage.local.get('bookMetadata', function (data) {
            sendResponse({metadata: data && data.bookMetadata ? data.bookMetadata : null});
        })
        return true;
    }
    if (request.type === 'set book metadata') {
        storageSet({
            'bookMetadata': request.metadata && typeof request.metadata === 'object' ?
                            request.metadata : null
        }, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // The whole library, and the catalog it was merged from beside it - see
    // getStyleLibrary.
    if (request.type === 'get style library') {
        getStyleLibrary(function (library, catalog) {
            sendResponse({library: library, catalog: catalog});
        });
        return true;
    }
    // Written whole, by the one page that edits it. Normalized on the way in
    // rather than trusted: this is the shape the capture path reads, and a field
    // the page got wrong would be a style that matches nothing or everything.
    if (request.type === 'set style library') {
        setStyleLibrary(normalizeStyleLibrary(request.library), function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // The page the library previews styles against, or null when nobody has taken
    // one. Read by the library page only; the capture path has the live page.
    if (request.type === 'get style snapshot') {
        chrome.storage.local.get('styleSnapshot', function (data) {
            sendResponse({snapshot: data && data.styleSnapshot ? data.styleSnapshot : null});
        });
        return true;
    }
    if (request.type === 'clear style snapshot') {
        storageRemove('styleSnapshot', function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // 'get current style' / 'set current style' were here. They fed a
    // 'currentStyle' key the popup wrote and nothing read - the capture path
    // always worked the match out for itself, and now selectStylesForUrl is the
    // only thing that decides which styles a page takes.
    if (request.type === 'get include style') {
        chrome.storage.local.get('includeStyle', function (data) {
            if (!data) {
                sendResponse({includeStyle: false});
            } else {
                sendResponse({includeStyle: data.includeStyle});
            }
        });
        return true;
    }
    if (request.type === 'set include style') {
        storageSet({'includeStyle': request.includeStyle}, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    if (request.type === 'get reader mode') {
        chrome.storage.local.get('readerMode', function (data) {
            if (!data) {
                sendResponse({readerMode: false});
            } else {
                sendResponse({readerMode: data.readerMode});
            }
        });
        return true;
    }
    if (request.type === 'set reader mode') {
        storageSet({'readerMode': request.readerMode}, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    if (request.type === 'get save destination') {
        chrome.storage.local.get(request.keys, function (data) {
            if (!data) {
                sendResponse({});
            } else {
                sendResponse(data);
            }
        });
        return true;
    }
    if (request.type === 'set save destination') {
        delete request.type;
        storageSet(request, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    // A preference rather than part of a book, so it is not among the keys
    // 'remove' discards - it has to still be set for the save after this one.
    if (request.type === 'get review before saving') {
        chrome.storage.local.get('reviewBeforeSaving', function (data) {
            if (!data) {
                sendResponse({reviewBeforeSaving: false});
            } else {
                sendResponse({reviewBeforeSaving: data.reviewBeforeSaving});
            }
        });
        return true;
    }
    if (request.type === 'set review before saving') {
        storageSet({
            'reviewBeforeSaving': request.reviewBeforeSaving
        }, function (error) {
            sendResponse(writeResponse(error));
        });
        return true;
    }
    if (request.type === 'is busy?') {
        isBusy((busy) => {
            sendResponse({isBusy: busy})
        })
        return true;
    }
    // the extraction is still running - see JOB_TIMEOUT. The job it is about is
    // named, and the tab it came from is checked: a job that timed out while its
    // page kept working must not keep the job that replaced it alive.
    if (request.type === 'job-heartbeat') {
        touchJob(request.jobId, sender)
        sendResponse({ok: true});
        return false;
    }
    // Answered before the command runs, not after: the work reaches into the
    // page and ends in a download, far longer than a popup that closes as soon
    // as the command starts stays alive to hear about it.
    if (request.type === 'save-page' || request.type === 'save-selection' ||
        request.type === 'add-page' || request.type === 'add-selection' ||
        request.type === 'style-snapshot') {
        sendResponse({started: true});
        executeCommand({type: request.type})
        return false;
    }
    // The page reporting that the build is over. Ends the job it names and no
    // other: a late 'done' from a reclaimed job used to take the badge off, strip
    // the injected styles from a page the next job was still reading, and close
    // the popup waiting on it. A 'done' with no job to match - the chapter
    // editor's own Generate button, which never claimed one - now ends nothing.
    if (request.type === 'done') {
        sendResponse({ok: true});
        endJob(request.jobId, sender)
        return false;
    }
    if (request.type === 'save to crosspoint') {
        const {blob, fileName} = request;
        readSaveDestinationFromBackground()
            .then((dest) => {
                saveEbookToCrosspoint(dest, blob, fileName)
                    .then(sendResponse)
                    .catch(sendResponse);
            });
        return true;
    }
    // an unknown type still has a sender waiting on a callback
    sendResponse({});
    return false;
}
