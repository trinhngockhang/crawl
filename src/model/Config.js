import mongoose from 'mongoose';
import moment from 'moment';

const config = new mongoose.Schema({
  pageCount: { type: Number, default: 0 },
  id: { type: Number, unique: true },
  crawlToDate: { type: Date },
  cookie: { type: String }
});

const Config = mongoose.model('Config', config);

export default Config;
