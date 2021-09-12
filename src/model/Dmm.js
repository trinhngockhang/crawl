import mongoose from 'mongoose';
import moment from 'moment';

const item = new mongoose.Schema({
  id: {type: String, unique: true},
  idPostInfo: { type: String },
  author: { type: String },
  pageId: { type: String, default: null },
  store: { type: String, default: null },
  ga: Array,
  pixel: Array,
  react: { type: Number, default: 0 },
  userView: String,
  platform: { type: String },
  imageUrl: String,
  comment: { type: Number, default: 0 },
  share: { type: Number, default: 0 },
  updatedInfo: { type: Boolean, default: false },
  history: {type: Array, default: []},
  title: { type: String, default: null },
  moved: { type: Boolean, default: false },
  content: { type: String, default: null },
  postFbId: { type: String, default: null },
  lastUpdateHistory: { type: Date, default: '1999-01-01' },
  postTime:{ type: Date, default: Date.now  },
  createdAt:{ type: Date, default: Date.now } 
});

const Item = mongoose.model('dmm', item);
export default Item;
