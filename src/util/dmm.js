import puppeteer from "puppeteer";
import mongoose from "mongoose";
import * as midItem from "../middle/MidItem";
import moment from "moment";
import * as midConfig from "../middle/MidConfig";
import _ from "lodash";
import got from "got";
import * as util from '../util/index';

// NUMBER_PER_PAGE * NUMBER_PAGE = 200

const NUMBER_PER_PAGE = 1;

export const openBrowser = async () => {
  const browser = await puppeteer.launch({
    userDataDir: "./dmm",
    defaultViewport: null,
    headless: true,
    args:['--no-sandbox']
    // args: ["--proxy-server=socks5://45.32.101.156:28982"],
  });
  return browser;
};

export const spyDmm = async (fromBegin) => {
  const NUMBER_PAGE = fromBegin? 150 : 50;
  let browser = await openBrowser();
  let continueCrawl = true;
  while (continueCrawl) {
    const config = await midConfig.getConfig(2);
    let pageCount = 1;
    let toDate = config.crawlToDate;
    let fromDate = moment(toDate).subtract(1, "days");
  
    // let toDate = moment(Date.now());
    
    for (let pageTime = 0; pageTime < NUMBER_PAGE; pageTime++) {
      let link= `https://dmmspy.com/v2/dynamic-grid?page=${pageCount}&search_mode=&q=&likes=&comments&platform=pod&sort=-post_time`
      if(!fromBegin){
        link = `https://dmmspy.com/v2/dynamic-grid?page=${pageCount}&search_mode=&q=&likes=&comments=&post_time=${moment(
          fromDate
        ).format("LL")}-${moment(toDate).format(
          "LL"
        )}&platform=pod&sort=-like`;
      }
      await sleep(1000);
      let page = await browser.newPage();

      await page.goto(
        link ,
        {
          waitUntil: "load",
          // Remove the timeout
          timeout: 0,
        }
      );
      await sleep(1000);
      // await page.evaluate(() => {
      //   window.scrollTo(0, document.body.scrollHeight);
      // });
      const url = await page.url();
      if (url.includes('login')) {
        console.log('CHa dang nhap, tien hanh dang nhap DMM: ');
        await page.waitFor('.panel-body', { timeout: 4000 });
        await page.type('#id_username', 'toilaphongls1@gmail.com');
        await page.type('#id_password', 'vitaminspyspy');
        await page.click('button[type=submit]');
      }
      await page.waitFor(".owner-name");
      let itemNumber = 0;
      for (let time = 0; time < NUMBER_PER_PAGE; time++) {
        pageCount++;
        await sleep(2500);
        let { data, number } = await page.evaluate((itemNumber) => {
          const final = [];
          const cards = document.querySelectorAll(".spy3-grid-container");
          for (let i = itemNumber; i < cards.length; i++) {
            const card = cards[i];
            const author = card.querySelector(".owner-name a").innerText;
            const pageId = card
              .querySelector(".owner-name a")
              .href.split("page:")[1];

            const store = card.querySelector(".linked-link").innerText;
            const linkDetail = card.querySelector(".spy3-grid-thumbnail>a")
              .href;
            const id = linkDetail.split("&id=")[1];
            const platform = card.querySelector(".platform-bar img")?.title;
            const postTime = card.querySelector(".caption span").innerText;

            const pixelArr = card.querySelectorAll(".pixel_id_tag");
            const pixel = [];
            for (let j = 0; j < pixelArr.length; j++) {
              pixel.push(pixelArr[j]?.innerText);
            }
            let react =
              card.querySelector(".reaction-bar span")?.innerText.trim() || "0";
            let comment =
              card.querySelector(".fa-comment")?.parentNode?.innerText.trim() ||
              "0";
            let share =
              card.querySelector(".fa-share")?.parentNode?.innerText.trim() ||
              "0";

            // lower case
            react = react.toLowerCase();
            comment = comment.toLowerCase();
            share = share.toLowerCase();
            const imageUrl = card.querySelector(".center-block")?.attributes
              ?.src2?.value || card.querySelector(".center-block")?.attributes
              ?.src1?.value;
            // push to final
            final.push({
              id,
              react: react.includes("k") ? react.split("k")[0] * 1000 : react,
              author,
              store,
              pixel,
              pageId,
              platform,
              imageUrl,
              comment: comment.includes("k")
                ? comment.split("k")[0] * 1000
                : comment,
              share: share.includes("k") ? share.split("k")[0] * 1000 : share,
              postTime,
            });
          }
          itemNumber = cards.length;
          return { data: final, number: cards.length };
        }, itemNumber);
        itemNumber = number;
        console.log('START GET IMAGE OF PAGE:' + pageCount);
        data = await Promise.all(
          data.map((item) => {
            return new Promise(async (resolve, reject) => {
              try {
                const check = await midItem.checkDmmExist(item.id);
                if (!check) {
                  console.log('DMM VAN CON DATA');
                  const result = await got(item.imageUrl);
                  const newUrl = await util.upfile(result.rawBody);
                  resolve({ ...item, imageUrl: newUrl });
                }
                resolve(item);
              } catch (e) {
                console.log(e);
                resolve(item);
              }
            });
          })
        );
        await midItem.insertManyDmm(
          data.map((item) => {
            let oldTime = item.postTime;
            let { year, month, week, day, min, hour } = convertTime(oldTime);
            const now = moment(Date.now())
              .subtract(year, "years")
              .subtract(month, "months")
              .subtract(week, "weeks")
              .subtract(day, "days")
              .subtract(hour, "hours")
              .subtract(min, "minutes");
            return {
              ...item,
              postTime: now,
              platform: _.capitalize(item.platform),
            };
          })
        );
      }
      await sleep(500);
      console.log("PAGE: " + pageCount);
      if (!fromBegin) await midConfig.updateConfig(pageCount, 2);
      const cookies = await page.cookies();
      const cookiesString = cookies
        .map((item) => `${item.name}=${item.value}`)
        .join(";");
      await midConfig.updateCookie(2, cookiesString);
      await page.close();
    }
    if (!fromBegin) await midConfig.updateDate({ crawlToDate: fromDate });
    continueCrawl = false;
  }
  browser.close()
};

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const convertTime = (oldTime) => {
  let year = 0;
  let month = 0;
  let day = 0;
  let week = 0;
  let hour = 0;
  let min = 0;

  if (oldTime.includes("year ") || oldTime.includes("year,")) {
    year = 1;
  }
  if (oldTime.includes("years")) {
    year = oldTime.split("y")[0];
  }
  if (oldTime.includes("month,") || oldTime.includes("month ")) month = 1;
  if (oldTime.includes("months")) {
    month = oldTime.split("months")[0].split(" ").pop();
  }
  if (oldTime.includes("week,") || oldTime.includes("week ")) week = 1;
  if (oldTime.includes("weeks")) {
    week = oldTime.split("weeks")[0].split(" ").pop();
  }
  if (oldTime.includes("day,") || oldTime.includes("day ")) day = 1;
  if (oldTime.includes("days")) {
    day = oldTime.split("days")[0].split(" ").pop();
  }
  if (oldTime.includes("hour,")) hour = 1;
  if (oldTime.includes("hours")) {
    hour = oldTime.split("hours")[0].split(" ").pop();
  }
  if (oldTime.includes("min,")) min = 1;
  if (oldTime.includes("min")) {
    min = oldTime.split("min")[0].split(" ").pop();
  }
  return {
    year,
    month,
    week,
    day,
    hour,
    min,
  };
};
