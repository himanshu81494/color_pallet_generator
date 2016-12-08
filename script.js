function setKeys(key, secret) {
  localStorage.setItem('CLIENT_ID', key);
  localStorage.setItem('CLIENT_SECRET', secret);
  $('#imageupload').attr('style', 'display: block;');
}

function getCredentials(cb) {
  var CLIENT_ID = localStorage.getItem('CLIENT_ID');
  var CLIENT_SECRET = localStorage.getItem('CLIENT_SECRET');

  var data = {
    'grant_type': 'client_credentials',
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET
  };

  return $.ajax({
    'url': 'https://api.clarifai.com/v1/token',
    'data': data,
    'type': 'POST'
  })
  .then(function(r) {
    localStorage.setItem('accessToken', r.access_token);
    localStorage.setItem('tokenTimestamp', Math.floor(Date.now() / 1000));
    cb();
  }, function() {
    error();
  });
}

function postImage(imgurl) {
  var data = {
    'url': imgurl
  };
  var accessToken = localStorage.getItem('accessToken');

  return $.ajax({
    'url': 'https://api.clarifai.com/v1/color',
    'headers': {
      'Authorization': 'Bearer ' + accessToken
    },
    'data': data,
    'type': 'POST'
  }).then(function(r){
    $('#images').append('<img class="fader" src="' + imgurl + '" />');
    parseResponse(r);
  }, function() {
    error();
  });
}

function error() {
  $('.error').append('Something isn\'t right. Try resetting your <span>API keys</span>.');
  $('.error span').click(function() {
    reset();
  });
}

function reset() {
  localStorage.clear();
  $('#keys').attr('style', 'display: block;');
  $('.error').empty();
}

function parseResponse(resp) {
  var tags = [];
  var names = [];
  if (resp.status_code === 'OK') {
    var colors = resp.results[0].colors;
    for (var i = 0; i < colors.length; i++) {
      tags.push(colors[i].hex);
      names.push('@' + colors[i].w3c.name + ': ' + tags[i] + ';');
      $('#tags').append(
        '<div class="color-block" title="'+tags[i]+'" style="background-color: ' + tags[i] + '">' + tags[i] + '</div>'
      );
    }
  } else {
    console.log('Sorry, something is wrong.');
  }

  downloadLessFile(names);
}

var textFile = null; // globals are evil... but I need this
function createLessFile(text) {
  var data = new Blob([text], {type: 'text/plain'});

  // manually revoke the object URL to avoid memory leaks
  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }

  textFile = window.URL.createObjectURL(data);

  return textFile;
}

function downloadLessFile(names) {
  var text = names.toString().replace(/,/g, '\n');
  $('#downloadlink').attr('href', createLessFile(text));
  $('#downloadable').attr('style', 'display: block;');
}

function run(imgurl) {
  if (Math.floor(Date.now() / 1000) - localStorage.getItem('tokenTimeStamp') > 86400
    || localStorage.getItem('accessToken') === null) {
    getCredentials(function() {
      postImage(imgurl);
    });
  } else {
    postImage(imgurl);
  }
  localStorage.setItem('imgurl', imgurl);
}



function readyFn( jQuery ) {
  $("#imgurl").val(localStorage.getItem('imgurl'));
}
$( document ).ready( readyFn );
// or:
// $( window ).load( readyFn );


