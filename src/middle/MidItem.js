import Spypro from "../model/Spypro";
import Dmm from "../model/Dmm";
import Item from '../model/Item';

export const insertOne = async (item) => {
  try {
    await Item.create(item);
  } catch (e) {
    return e;
  }
};

export const getItem = async({ limit, offset, sort = { postTime: "DESC" } }, query) => {
  const items = await Item.find(query).limit(limit).skip(offset).sort(sort);
  return items;
};
export const insertManySpypro = async (items) => {
  try {
    const inserted = await Spypro.insertMany(items, {
      continueOnError: true,
      safe: true,
      ordered: false,
    });
    console.log("IMPORT THANH CONG: " + inserted.length);
  } catch (e) {
    console.log(JSON.stringify(e).substring(0, 200));
    return e;
  }
};

export const checkSpyproExist = async (id) => {
  const item = await Spypro.findOne({ id });
  return item? true: false;
};

export const checkDmmExist = async (id) => {
  const item = await Dmm.findOne({ id });
  return item? true: false;
};

export const insertManyDmm = async (items) => {
  try {
    const inserted = await Dmm.insertMany(items, {
      continueOnError: true,
      safe: true,
      ordered: false,
    });
    console.log("IMPORT THANH CONG DMM: " + inserted.length);
  } catch (e) {
    console.log(JSON.stringify(e).substring(0, 200));
    return e;
  }
};

export const checkExistSpypro = async (id) => {
  try {
    const item = Spypro.findOne(id);
    if (item) return true;
    else return false;
  } catch (e) {
    return false;
  }
};

export const updateManySpypro = async (condition, items) => {
  try {
    const res = await Spypro.updateMany(condition, items);
    return res;
  } catch(e){
    console.log(e);
  }
  
}

export const updateManyItem = async (condition, items) => {
  console.log(condition);
 
  return await Item.updateMany(condition, items);
}

export const updateItemFinal = async(_id, item) => {
  try {
    await Item.updateOne({ _id }, item);
  } catch(e){
    console.log(e);
  }
};