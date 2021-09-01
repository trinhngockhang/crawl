import * as midItem from "../middle/MidItem";
import moment from "moment";
import _ from "lodash";
import * as util from "./index";
import * as midConfig from "../middle/MidConfig";
import { TOOLS } from "../constant";
import puppeteer from "puppeteer";

let browser = null;
let page1 = null;
let page2 = null;


const initBrowser = async () => {
  browser = await puppeteer.launch({
    userDataDir: "./dataChrome",
    defaultViewport: null,
    headless: true,
    args: ["--proxy-server=socks5://45.32.101.156:28982", "--no-sandbox"],
  });
  page1 = await browser.newPage();
  page2 = await browser.newPage();
};
const sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  
const getData = async (id, index) => {
    try{
        console.log(id)
        const link = "https://tools.spypro.io/chart/post/"+ id;
        let page = index == 0 ? page1 : page2;
        await page.goto(link, {
          waitUntil: "load",
          // Remove the timeout
          timeout: 0,
        });
        const url = await page.url();
        if (url.includes("login")) {
          console.log("Dang nhap Spypro:");
          try {
            await page.waitFor("a.auth-google");
            await page.click("a.auth-google");
            await sleep(2000);
            await page.goto(link, {
              waitUntil: "load",
              // Remove the timeout
              timeout: 0,
            });
            console.log("DONe LOGIN");
          } catch (err) {
            console.log("loi login: ", err);
          }
        }
        let bodyHTML = await page.evaluate(() => document.body.innerHTML);
        return bodyHTML;
    } catch(e){
        console.log(e)
        return null
    }
  
};
const getSpyproData = async (id, index) => {
  try {
    const response = await getData(id, index);
    const beforeMorrisLine = response.split("Morris.Line")[0];
    const dayData = beforeMorrisLine.split("day_data =").pop();
    const dayDataJson = JSON.parse(dayData.replace(";", ""));
    return dayDataJson;
  } catch (e) {
    console.log(e);
    return [];
  }
};

const loop = async (condition, func, sort = { score: "DESC" }) => {
  const offset = 0;
  const CONCURENCY = 400;
  for (let i = 0; i < 50; i++) {
    //await sleep(00);
    console.log("QUET LAN: " + i);
    const queryRes = await midItem.getItem(
      { limit: CONCURENCY, offset: offset, sort },
      condition
    );
    const arr = [];
    for(let j = 0; j < queryRes.length; j += 2){
        arr.push(queryRes.slice(j, j + 2))
    }
    if (queryRes.length > 0) {
      for(let k = 0; k < arr.length; k++ ){
        await Promise.all(await func(arr[k]));
      }
      
    }
  }
};

const updateHistory = async (listItem) => {
  return listItem.map(async (item, index) => {
   await updateSingleHistory(item, TOOLS.SPYPRO, index);
  });
};

const updateSingleHistory = async (item, type, index) => {
  return new Promise(async (resolve, reject) => {
    // check data history neu lau chua cap nhat thi k cap nhat nua
    if (item.history.length > 0) {
      const history = _.last(item.history);
      const day = moment(Date.now()).diff(
        moment(history.period, "YYYY-MM-DD"),
        "days"
      );
      if (day > 20) {
        resolve();
      }
    }
    // get data va cap nhat
    let dataHistory =
      type == TOOLS.DMM ? await getDmmData(item) : await getSpyproData(item.id, index);
    if (dataHistory) {
      dataHistory = randomHistory(dataHistory);
      const valueComment = _.last(dataHistory)?.comment
        ? _.last(dataHistory)?.comment
        : 0;
      const valueReact = _.last(dataHistory)?.reaction
        ? _.last(dataHistory)?.reaction
        : 0;
      const valueShare = _.last(dataHistory)?.share
        ? _.last(dataHistory)?.share
        : 0;

      if (dataHistory.length > 0) {
        await midItem.updateItemFinal(item._id, {
          history: dataHistory,
          share: valueShare,
          react: valueReact,
          comment: valueComment,
          lastUpdateHistory: moment(Date.now()).format(),
        });
      } else {
        await midItem.updateItemFinal(item._id, {
          lastUpdateHistory: moment(Date.now()).format(),
        });
      }

    } else {
      await midItem.updateItemFinal(item._id, {
        lastUpdateHistory: moment(Date.now()).format(),
      });
    }
    resolve();
  });
};

export const updateHistoryForTrending = async (score) => {
try {
  if (!browser) initBrowser();
  await loop(
    {
      lastUpdateHistory: {
        $lt: moment(Date.now()).subtract(score? 1: 24, "hours").format(),
      },
      dataOrigin: "Spypro",
    },
    updateHistory,
    score? { score: "DESC" } : { postTime: "DESC" }
  );
  if(browser) browser.close();
} catch(e){

}

};

const getLastRandom = (number) => {
  if (number < 50) return 0;
  if (number < 200) {
    return _.random(1, 3);
  } else if (number > 200 && number < 1000) {
    return _.random(-4, 4);
  } else if (number > 1000 && number < 10000) {
    return _.random(-30, 30);
  } else {
    return _.random(-50, 50);
  }
};

const randomHistory = (history) => {
  if (!history || history.length == 0) return [];

  const lastHistory = _.last(history);
  if (
    lastHistory.reaction < 10 ||
    lastHistory.comment < 10 ||
    lastHistory.share < 10
  )
    return history;
  let lastUpdateReact = getLastRandom(lastHistory.reaction);
  let lastUpdateCmt = getLastRandom(lastHistory.comment);
  let lastUpdateShare = getLastRandom(lastHistory.share);

  let final = [...history];
  for (let i = history.length - 1; i >= 0; i--) {
    if (i == history.length - 1) {
      final[i].reaction = history[i].reaction + lastUpdateReact;
      final[i].comment = history[i].comment + lastUpdateCmt;
      final[i].share = history[i].share + lastUpdateShare;
    } else {
      const disReaction = final[i + 1].reaction - final[i].reaction;
      const disComment = final[i + 1].comment - final[i].comment;
      const disShare = final[i + 1].share - final[i].share;
      const CHANGE_SIG = 45 / 46;
      if (final[i].reaction >= final[i + 1].reaction) {
        final[i].reaction = final[i + 1].reaction;
      } else {
        final[i].reaction += _.random(
          -disReaction + _.floor(disReaction * CHANGE_SIG),
          disReaction - _.floor(disReaction * CHANGE_SIG)
        );
        if (final[i].reaction > final[i + 1].reaction)
          final[i].reaction = final[i + 1].reaction;
      }
      if (final[i].comment >= final[i + 1].comment) {
        final[i].comment = final[i + 1].comment;
      } else {
        final[i].comment += _.random(
          -disComment + _.floor(disComment * CHANGE_SIG),
          disComment - _.floor(disComment * CHANGE_SIG)
        );
        final[i].comment = final[i].comment >= 0 ? final[i].comment : 0;
      }
      if (final[i].share >= final[i + 1].share) {
        final[i].share = final[i + 1].share;
      } else {
        final[i].share += _.random(
          -disShare + _.floor(disShare * CHANGE_SIG),
          disShare - _.floor(disShare * CHANGE_SIG)
        );
        final[i].share = final[i].share >= 0 ? final[i].share : 0;
      }
    }
  }
  return final;
};
