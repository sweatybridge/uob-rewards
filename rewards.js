var https = require('https');
var cheerio = require('cheerio');

// sets up http connection
var options = {
  host: 'uniservices.uobgroup.com',
  port: 443,
  path: '/NASApp/RUS/RedeemServlet?sortBy=summary&type=normal'
}

https.get(options, function (resp) {
  // set cookie for real request
  var cookie = resp.headers['set-cookie'][0].split(';')[0];
  options['headers'] = {
    'Cookie': cookie
  };

  https.get(options, function (realResp) {
    var html = '';
    realResp.on('data', function (data) {
      // collect buffered data chunks
      html += data.toString();

    }).on('end', function () {
      // calculate top deals from full dom
      var selector = cheerio.load(html);
      var items = getTopDeals(selector);

      // outputs the top 10 deals (lower means better)
      console.log(items.slice(0, 10));
      process.exit();
    });
  });
});

// takes in a cheerio or jquery backed dom selector
// returns a sorted array of kvp in increasing point to dollar ratio
function getTopDeals ($) {
  var items = [];

  $('a.Box2').each(function () {
    // calculate benefit
    var key = $(this).text().trim();

    var start = key.indexOf('$');
    if (start == -1) return;
    var end = key.indexOf(' ', start);

    var benefit = key.substring(start + 1, end);

    // calculate cost
    var cost = $(this).parent().next().text().trim();

    start = cost.indexOf('$');
    if (start == -1) return;
    end = cost.length;

    cost = cost.substring(start + 1, end);

    // calculate point to dollar ratio
    var value = cost / benefit;

    items.push({
      'key': key,
      'value': value
    });
  });

  // sort in increasing order of point to dollar ratio
  // lower means higher return for the same amount of points
  items.sort(function (first, second) {
    return first.value - second.value;
  });

  return items;
}