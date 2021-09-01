import mongoose from 'mongoose';
import moment from 'moment';

const item = new mongoose.Schema({
  id: {type: String, unique: true},
  author: { type: String },
  pageId: { type: String ,index: true, default: null },
  store: { type: String, default: null },
  ga: Array,
  pixel: Array,
  react: { type: Number, default: 0, index: true },
  userView: String,
  platform: { type: String, index: true },
  imageUrl: String,
  comment: { type: Number, default: 0, index: true },
  share: { type: Number, default: 0 },
  history: {type: Array, default: []},
  title: { type: String, default: null },
  content: { type: String, default: null },
  moved: { type: Boolean, default: false },
  updatedInfo: { type: Boolean, default: false },
  postFbId: { type: String, default: null },
  lastUpdateHistory: { type: Date, default: '1999-01-01' },
  postTime:{ type: Date, default: Date.now, index: true },
  createdAt:{ type: Date, default: Date.now } 
});

const Item = mongoose.model('spypro', item);
export default Item;
