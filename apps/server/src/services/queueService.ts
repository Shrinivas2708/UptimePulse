import { Queue, Worker, QueueEvents } from "bullmq";
import Monitor from "../models/Monitor";
import { performCheck } from "./checkService";
import logger from '../utils/logger';

const redisConnection = { url: process.env.REDIS_URL! };

let checkQueue: Queue;
let worker: Worker;
let queueEvents: QueueEvents;

export function initQueue() {
  logger.info("Initializing BullMQ queue...");
  checkQueue = new Queue("checks", { connection: redisConnection });

  worker = new Worker(
    "checks",
    async (job) => {
      logger.info(job)
      logger.info(`Processing job ${job.id} for monitor ID: ${job.data.monitorId}`);
      const monitor = await Monitor.findById(job.data.monitorId);
      if (!monitor) {
        logger.info(`Monitor not found for job ${job.id}. Skipping check.`);
        return;
      }
      await performCheck(monitor);
      logger.info(`Job ${job.id} for monitor ID ${job.data.monitorId} completed.`);
    },
    { connection: redisConnection }
  );

  queueEvents = new QueueEvents("checks", { connection: redisConnection });

  worker.on("ready", () => logger.info("⚡ BullMQ Worker connected"));
  worker.on("error", (err) => logger.error("Redis Worker error:", err));
  queueEvents.on("failed", (job, err) => logger.error(`❌ Job ${job?.jobId} failed:`, err));
}

export const queueCheck = async (monitorId: string): Promise<void> => {
  if (!checkQueue) throw new Error("Queue not initialized. Call initQueue() first.");
  logger.info(`Queueing new check for monitor ID: ${monitorId}`);
  await checkQueue.add("performCheck", { monitorId }, { removeOnComplete: true, removeOnFail: 50 });
};