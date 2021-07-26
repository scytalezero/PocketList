// ==UserScript==
// @name         PocketList
// @namespace    http://ligature.me/
// @version      1.2
// @description  Show my pocket list
// @author       You
// @match        https://wiki.ligature.me
// @match        https://wiki.ligature.me/home
// @match        https://wiki.ligature.me/en/home
// @match        https://dev.azure.com/ashcompanies/FrontEnd/_git/notes-bryanc?path=%2FDashboard.md&version=GBmaster&_a=preview
// @match        https://dev.azure.com/ashcompanies/FrontEnd/_git/notes-bryanc?path=%2FDashboard.md&_a=preview
// @connect      getpocket.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function() {
  'use strict';

  function ajax(url) {
    return new Promise((res, rej) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: {
          'content-type': 'application/json',
        },
        onload: function(response) {
          res(JSON.parse(response.responseText))
        },
        onerror: function(err) {
          rej(err)
        },
      })
    })
  }

  const limit = 3000
  function waitFor(selector) {
    const start = Date.now()
    console.debug('Starting waitFor')
    return new Promise((res, rej) => {
      const checkSelector = () => {
        //Dump out if we are past our limit
        if (start && ((Date.now() - start) > limit)) {
          console.debug('Rejecting waitFor')
          rej(`Waiting for '${selector}' timed out`)
          return
        }
        if (document.querySelector(selector)) {
          console.debug('Resolving waitFor')
          res(document.querySelector(selector))
        } else {
          console.debug('Sleeping waitFor')
          setTimeout(checkSelector, 250)
        }
      }
      checkSelector()
    })
  }

  function createItem(article) {
    return `<div
      class="pocketItem"
      title="${article.resolved_title}">
      <a class="pocketTitle" href="https://getpocket.com/read/${article.item_id}" target="_blank">${article.resolved_title}</a>
    </div>`
  }

  function createCss() {
    const style = document.createElement('style');
    style.innerHTML = `
      .pocketList {
        display: flex;
        flex-wrap: wrap;
      }
      .pocketItem {
        -moz-osx-font-smoothing: grayscale;
        -ms-flex-align: center;
        -webkit-box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        align-items: center;
        background-color: #e0e0e0;
        border-radius: 16px;
        border-width: 0;
        box-sizing: border-box;
        cursor: pointer;
        display: -ms-inline-flexbox;
        display: inline-flex;
        font-family: Roboto,sans-serif;
        font-size: .875rem;
        font-weight: 400;
        height: 32px;
        letter-spacing: .0178571429em;
        line-height: 1.25rem;
        margin: 0 0.3rem 0.3rem 0;
        outline: none;
        padding: 0 12px;
        position: relative;
        text-decoration: inherit;
        text-transform: inherit;
      }
      .pocketTitle {
        color: rgba(0,0,0,.87) !important;
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      @media only screen and (min-width: 767px) {
        .pocketTitle {
          max-width: 250px;
      }
    `;
    document.head.appendChild(style);
  }

  waitFor('div.pocketList')
    .then(async elem => {
      console.debug('Inserting pocketList')
      createCss()
      const pocketData = await ajax(`https://getpocket.com/v3/get?consumer_key=95425-43a4ebf0ca6fe9f92ef5a165&access_token=d221df4a-e8e8-248e-74ad-e7ee52`)
      elem.innerHTML = Object.keys(pocketData.list)
        .map(id => pocketData.list[id])
        .sort((a, b) => (a.time_added < b.time_added) ? -1 : 1)
        .map(item => createItem(item))
        .join('\n')
    })
    .catch(console.error)
})();
