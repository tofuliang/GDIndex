import aria2 from './aria2';
import api from './api';
import nodeUrl from 'url';
import nodePath from 'path';
import prettyBytes from 'pretty-bytes';

const usingHTTPS = () => {
    return window.location.protocol === 'https:';
};

const replaceSpecialCharacter = segment => {
    return segment.replace('/', '$_').replace('#', '%23');
};

const getFileUrl = (path, rootId) => {
    let u = nodeUrl.resolve(
        window.props.api,
        path
            .split('/')
            .map(encodeURIComponent)
            .join('/')
    );
    if (rootId) {
        u += '?rootId=' + rootId;
    }
    return u;
};

const resolvePath = (base, p) => {
    if (base.slice(-1) === '/') {
        base = base.substr(0, base.length - 1);
    }
    if (p.charAt(0) === '/') {
        p = p.substr(1);
    }
    return `${base}/${p}`;
};

const listItems = async (path, rootId) => {
    let finished = false;
    while (!finished) {
        try {
            let { files } = await api
                .post(path, {
                    method: 'POST',
                    qs: {
                        rootId
                    }
                })
                .json();
            files = files.map(f => {
                f.mimeType = f.mimeType.replace('; charset=utf-8', '');
                const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
                let resourcePath = resolvePath(path, replaceSpecialCharacter(f.name)) + (isFolder ? '/' : '');
                const url = getFileUrl(resourcePath, rootId);
                const o = {
                    fileName: f.name,
                    isFolder,
                    mimeType: f.mimeType,
                    fileSize: f.size ? prettyBytes(parseInt(f.size)) : '',
                    fileRawSize: parseInt(f.size || '0'),
                    path: resourcePath,
                    url
                };
                return o;
            });
            finished = true;
            return files;
        } catch (e) {
            console.log(e);
        }
    }
};

const getPathItems = (path, rootId, recursive = true, concurrency = 3, retry = 3, onProgressUpdate = null) => {
    return new Promise((resolve, reject) => {
        const result = {};
        const queue = [{ path, result, key: path }];

        const updateProgress = () => {
            if (!onProgressUpdate) {
                return;
            }
            const remainingPathCount = queue.length;
            onProgressUpdate(remainingPathCount);
        };

        const fetchPath = async (path, result, key) => {
            const fetchPathItems = async (path, rootId, retryTimes = 3) => {
                try {
                    return await listItems(path, rootId);
                } catch (e) {
                    if (retryTimes > 0) {
                        console.log(`Fetch path ${path} data failed, retrying`);
                        return fetchPathItems(path, rootId, retryTimes - 1);
                    }
                    throw e;
                }
            };

            const pathItems = await fetchPathItems(path, rootId, retry);

            // construct results
            const folders = pathItems.filter(f => f.isFolder);
            const files = pathItems.filter(f => !f.isFolder);

            if (!result[key]) {
                result[key] = {};
            }
            if (!result[key]['children']) {
                result[key]['children'] = {};
            }
            for (const i of pathItems) {
                const name = i.fileName;
                result[key]['children'][name] = i;
            }

            if (!recursive) {
                // stop if we don't recursive or no more folders to dive
                return;
            }

            // ..if dive
            // add folder paths
            const queuePaths = folders.map(f => {
                const basename = nodePath.basename(f.path);
                return {
                    path: f.path,
                    result: result[key]['children'],
                    key: basename
                };
            });
            // add folders to queue
            queue.push(...queuePaths);
        };

        const promises = {};
        const onSuccess = () => {
            resolve(result[path]);
        };
        const onError = e => {
            reject(e);
        };
        let id = 1;
        const scheduleTasks = () => {
            while (Object.keys(promises).length < concurrency && queue.length > 0) {
                const { path, result, key } = queue.shift();
                const taskId = id;
                id++;
                const p = fetchPath(path, result, key);
                promises[taskId] = p;
                p.then(
                    () => {
                        delete promises[taskId];
                        const promiseCount = Object.keys(promises).length;
                        updateProgress();
                        if (queue.length == 0 && promiseCount == 0) {
                            onSuccess();
                        } else {
                            scheduleTasks();
                        }
                    },
                    e => {
                        onError(e);
                    }
                );
            }
        };

        updateProgress();
        scheduleTasks();
    });
};

export default {
    usingHTTPS,
    getPathItems,
    replaceSpecialCharacter,
    shouldShowAriaHTTPSWarning: () => {
        return usingHTTPS() && !aria2.getRpcSecure();
    }
};
