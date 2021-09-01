import Config from "../model/Config";

export const insertOne = async (item) => {
  try {
    await Config.create(item);
  } catch (e) {
    return e;
  }
};

export const getConfig = async (id = 1) => {
  try {
    return await Config.findOne({ id });
  } catch (e) {
    return e;
  }
};

export const updateConfig = async (pageCount, id = 1) => {
  try {
    return await Config.findOneAndUpdate({ id }, { pageCount });
  } catch (e) {
    return e;
  }
};

export const updateCookie = async (id = 2, cookie) => {
  try {
    return await Config.findOneAndUpdate({ id }, { cookie });
  } catch (e) {
    return e;
  }
}

export const updateDate = async (item) => {
  try {
    return await Config.findOneAndUpdate({ id: 2 }, item);
  } catch (e) {
    return e;
  }
};


export const updateSpyproDate = async (item) => {
  try {
    return await Config.findOneAndUpdate({ id: 1 }, item);
  } catch (e) {
    return e;
  }
};
