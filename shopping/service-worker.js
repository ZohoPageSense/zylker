'use strict';
var _pushassist = {};

_pushassist.appkey = "AIzaSyAExvLquLphb8ImrLNOz_jo_3F47n__LuQ";
_pushassist.serverUrl = "https://api2.pushassist.com";
_pushassist.NotificationEvent = 0;

self.addEventListener('install', function (event) {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
    console.log("Activated Service-Worker");
    event.waitUntil(self.clients.claim());
});

/* show notifications send by server */
self.addEventListener('push', function (event) {
    if (!(self.Notification && self.Notification.permission === 'granted')) {
        return;
    }

    var sendNotification = function(title, message, url, icon, image, requireInteraction, notificationCloseEvent, vibrate, actions, data, tag) {

        var psa_notification_list = [];

        psa_notification_list.push(self.registration.showNotification(title, {
            body: message,
            image: image,
            requireInteraction: requireInteraction,
            notificationCloseEvent: notificationCloseEvent,
            vibrate: vibrate,
            icon: icon + '?notificationURL=' + encodeURIComponent(url),
            tag: tag,
            actions: actions,
            data: data
        }));

        return Promise.all(psa_notification_list);
    };

    if (event.data) {

        var data = event.data.json();

        event.waitUntil(
            sendNotification(data.title, data.message, data.url, data.icon, data.image, data.requireInteraction, data.notificationCloseEvent, data.vibrate, data.actions, data.data, data.tag)
        );

    } else {

        event.waitUntil(
            self.registration.pushManager.getSubscription().then(function(subscription) {
                if (!subscription) {
                    return;
                }

                var endpointURL = subscription.endpoint;
                var registration_id = endpointURL.substr(endpointURL.lastIndexOf('/') + 1);

                var json = {
                    json: JSON.stringify({
                        rid: registration_id
                    })
                };

                var messageUrl = _pushassist.serverUrl + "/sender/";

                return fetch(messageUrl, {method: 'post', body: json.json }).then(function (response) {

                    if (response.status !== 200) {
                        throw new Error();
                    }

                    // Examine the text in the response
                    return response.json().then(function (data) {
                        if (data.error || !data.notification) {
                            throw new Error();
                        }

                        return sendNotification(data.notification.title, data.notification.message, data.notification.url, data.notification.icon, data.notification.image, data.notification.requireInteraction, data.notification.notificationCloseEvent, data.notification.vibrate, data.notification.actions, data.notification.data, data.notification.tag);
                    });
                });
            })
        );
    }
});

self.addEventListener('notificationclick', function (event) {

    var notification = event.notification;

    var options = notification.data.options;

    event.notification.close();

    if (event.action === 'action1') {	//clicked on notification action1

        trackClick(1, event);

        event.waitUntil(
            clients.matchAll({
                    type: "window"
                })
                .then(function () {

					if(options[1].url !== '' && options[1].url !== undefined){

						return clients.openWindow(options[1].url);
					}
                })
        );
    } else if (event.action === 'action2') {

        trackClick(2, event);	//clicked on notification action2

        event.waitUntil(
            clients.matchAll({
                    type: "window"
                })
                .then(function () {

					if(options[0].url !== '' && options[0].url !== undefined){

						return clients.openWindow(options[0].url);
					}
                })
        );
    } else {

        trackClick(3, event);	//clicked on notification

        event.waitUntil(
            clients.matchAll({
                    type: "window"
                })
                .then(function (clientList) {

                    for (var i = 0; i < clientList.length; i++) {
                        var client = clientList[i];

                        if (client.url === '/' && 'focus' in client) {

                            return client.focus();
                        }
                    }

                    if (clients.openWindow) {

						var url_link = getURL();

						if(url_link !== '' && url_link !== undefined){

							return clients.openWindow(url_link);
						}
                    }
                })
        );
    }

    function getURL() {

        var query = event.notification.icon,
            url,
            queryString;

        if (query.indexOf('?notificationURL') > -1) {

            queryString = query.substring(query.indexOf('?notificationURL'));
            url = decodeURIComponent(queryString.split('=')[1]);

        } else {

            url = 'https://zohopagesense.github.io/zylker/shopping/';
        }

        return url;
    }

}, false);

function trackClick(click_on, event) {

    _pushassist.NotificationEvent = 1;

    self.registration.pushManager.getSubscription().then(function (subscription) {
        var endpointURL = subscription.endpoint;
        var registration_id = endpointURL.substr(endpointURL.lastIndexOf('/') + 1);

        var json = {
            json: JSON.stringify({
                registration_id: registration_id,
                message_id: event.notification.tag,
                clicked_on: click_on
            })
        };

        var messageUrl = _pushassist.serverUrl + "/sender/trackClick/";

        return fetch(messageUrl, {method: 'post', body: json.json }).then(function (response) {

            if (response.status === 200) { }
        });
    });
}

self.addEventListener('notificationclose', function (event) {

    if(_pushassist.NotificationEvent === 0){

        self.registration.pushManager.getSubscription().then(function (subscription) {
            var endpointURL = subscription.endpoint;
            var registration_id = endpointURL.substr(endpointURL.lastIndexOf('/') + 1);
    
            var json = {
                json: JSON.stringify({
                    registration_id: registration_id,
                    message_id: event.notification.tag,
                    clicked_on: 0
                })
            };
    
            var messageUrl = _pushassist.serverUrl + "/sender/trackClick/";
    
            return fetch(messageUrl, {method: 'post', body: json.json }).then(function (response) {
    
                if (response.status === 200) { }
            });
        });
    }
});

self.addEventListener('message', function (event) {
    var message = event.data;

    switch (message) {
        case 'dispatchRemoveNotifications':
            clients.matchAll({ type: "window" }).then(function (clientList) {
                for (var i = 0; i < clientList.length; i++) {
                    clientList[i].postMessage('removeNotifications');
                }
            });
            break;
        default:
            break;
    }
});
