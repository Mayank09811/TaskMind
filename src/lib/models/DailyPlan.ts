import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExtension {
  extraTime: number;       // hours
  reason: string;
  requestedAt: Date;
}

export interface IPointer {
  title: string;
  plannedETA: number;       // hours (e.g. 1.5)
  checkInTime: Date;        // when bot should ask
  startedAt: Date | null;
  completedAt: Date | null;
  actualTime: number | null; // hours
  status: 'pending' | 'in_progress' | 'done' | 'blocked' | 'delayed';
  delayReason: string | null;
  blocker: string | null;
  extensions: IExtension[];
}

export interface IDailyPlan extends Document {
  employee: mongoose.Types.ObjectId;
  date: string;             // "2026-05-08"
  status: 'collecting' | 'active' | 'completed';
  pointers: IPointer[];
  currentPointerIndex: number;
  eodReport: {
    generated: boolean;
    generatedAt: Date | null;
    summary: string | null;
  };
  createdAt: Date;
}

const ExtensionSchema = new Schema<IExtension>({
  extraTime: { type: Number, required: true },
  reason: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
}, { _id: false });

const PointerSchema = new Schema<IPointer>({
  title: { type: String, required: true },
  plannedETA: { type: Number, required: true },
  checkInTime: { type: Date, required: true },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  actualTime: { type: Number, default: null },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'done', 'blocked', 'delayed'],
    default: 'pending',
  },
  delayReason: { type: String, default: null },
  blocker: { type: String, default: null },
  extensions: [ExtensionSchema],
}, { _id: true });

const DailyPlanSchema = new Schema<IDailyPlan>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: String, required: true },
  status: {
    type: String,
    enum: ['collecting', 'active', 'completed'],
    default: 'collecting',
  },
  pointers: [PointerSchema],
  currentPointerIndex: { type: Number, default: 0 },
  eodReport: {
    generated: { type: Boolean, default: false },
    generatedAt: { type: Date, default: null },
    summary: { type: String, default: null },
  },
  createdAt: { type: Date, default: Date.now },
});

// Compound index: one plan per employee per day
DailyPlanSchema.index({ employee: 1, date: 1 }, { unique: true });

const DailyPlan: Model<IDailyPlan> =
  mongoose.models.DailyPlan || mongoose.model<IDailyPlan>('DailyPlan', DailyPlanSchema);

export default DailyPlan;
