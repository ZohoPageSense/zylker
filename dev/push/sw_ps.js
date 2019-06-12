//$Id: $
'use strict'; //No I18N

  var uuid;
  var sent_time;
  var portal;
  var projectKey;
  var exp_key;
  var collect_url;
  var button1_url;
  var button2_url;
  var button1_icon;
  var button2_icon;
  var notification_url;
  var conversion;
  


self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});


self.addEventListener('push', function(event) {
  
  var text = event.data.text(); 
  var json = JSON.parse(text);
  var title = json.title;
  var body = json.body;
  var icon = json.icon;
  var image = json.image;
  var is_auto_hide = json.is_auto_hide;
  
  uuid = json.push_uuid;
  sent_time = json.sent_time;
  portal = json.portal;
  projectKey = json.project_key;
  collect_url = json.collect_url;
  exp_key = json.exp_key;
  conversion = uuid+sent_time;
  
  var button1_name = json.button1_name;
  button1_url = json.button1_url;
  button1_icon = json.button1_icon;
  var button2_name = json.button2_name;
  button2_url = json.button2_url;
  button2_icon = json.button2_icon;
  
  var button_array = [];
  var button1_object = {};
  var button2_object = {};
  
  if(button1_name != null && button1_name != undefined){
    button1_object = { action:'button1_action',title:button1_name,icon:button1_icon} //No I18N
    button_array.push(button1_object);
  }
  if(button2_name != null && button1_name != undefined){
    button2_object = { action:'button2_action',title:button2_name,icon:button2_icon } //No I18N
    button_array.push(button2_object);
  }
  
  notification_url = json.notification_url;
 
  const options = {
    body: body,
    icon: icon, //No I18N
    image: image, //No I18N
    requireInteraction: is_auto_hide,
    actions: button_array
  };

  const showNotificationPromise = self.registration.showNotification(title, options); 
  event.waitUntil(showNotificationPromise);

  updatePushStatus(uuid, 4, sent_time, portal, projectKey, exp_key, event);
  

});

self.addEventListener('notificationclick', function(event) {  

  updatePushStatus(uuid, 5, sent_time, portal, projectKey, exp_key, event);

  let cacheOpenPromise, cacheWritePromise;
  let cacheClearPromise = caches.delete("zps-push").then(_ => { //No I18N
    cacheOpenPromise = caches.open("zps-push").then(cacheItem => {
      cacheWritePromise = cacheItem.put("zps-push-data.json?push_uuid="+uuid+"&sent_time="+sent_time, new Response()); //No I18N
    });
  });

  let cacheOperationsPromise = Promise.all([cacheClearPromise, cacheOpenPromise, cacheWritePromise]);
  event.waitUntil(cacheOperationsPromise);

  event.notification.close();
  
  if (!event.action) {
      // Was a normal notification click
    event.waitUntil(
      clients.openWindow(notification_url) //No I18N
    );
    return;
  }

  switch (event.action) {
    case 'button1_action':
      event.waitUntil(
            clients.openWindow(button1_url) //No I18N
          );
      break;
    case 'button2_action':
      event.waitUntil(
            clients.openWindow(button2_url) //No I18N
          );
      break;
    }
 
});

function updatePushStatus(uuid, push_status, sent_time, portal, projectKey, exp_key, event){


    var data = 
    {
    werd: {
            f: uuid, 
            pushstatus: push_status,
            s_t: sent_time,
            a: portal,
            p: projectKey,
            b: exp_key
        }
    };
  
    var server_url = ''; //No I18N
    server_url = 'https://'+collect_url + '/psimg.gif'; //No I18N
    server_url = server_url + '?raw=' + encodeURIComponent(JSON.stringify(data)); //No I18N
    server_url = server_url + '&type=18' //No I18N

  const updatePushPromise = fetch(server_url, {
    method: 'post', //No I18N
    headers: {
      "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"  //No I18N
    }
  });
  event.waitUntil(updatePushPromise);
         
      
}










