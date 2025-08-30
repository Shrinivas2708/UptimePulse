import { Request, Response } from 'express';
import Incident from '../models/Incident';
import Monitor from '../models/Monitor';
import logger from '../utils/logger';
export const addIncidentUpdate = async (req:Request,res:Response) : Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { id } = req.params;
    const { message, status } = req.body; // You can also update the incident status here

    const incident = await Incident.findById(id);
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }

    // Add the new update to the timeline
    incident.timeline.push({
      timestamp: new Date(),
      status: 'update',
      message,
      author: 'Maintainer' // You can enhance this later
    });

    // Optionally update the main status if provided
    if (status) {
      incident.status = status;
      if (status === 'resolved') {
        incident.resolvedAt = new Date();
      }
    }
    
    await incident.save();
    logger.info(`Added update to incident ${id}`);
    res.json(incident);

  } catch (err: any) {
    logger.error(`Failed to add update to incident ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
}
export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { userId } = userPayload;

  try {
    logger.info(`Fetching incidents for user: ${userId}`);
    const monitors = await Monitor.find({ userId }).select('_id');
    const monitorIds = monitors.map(m => m._id);
    const incidents = await Incident.find({ affectedServices: { $in: monitorIds } }).sort({ startedAt: -1 });
    res.json(incidents);
  } catch (err: any) {
    logger.error(`Failed to get incidents for user ${userId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getIncident = async (req: Request, res: Response): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { userId } = userPayload;

  try {
    const { id } = req.params;
    logger.info(`Fetching incident with ID: ${id}`);
    const incident = await Incident.findById(id).populate('affectedServices');
    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    // Verify the user owns at least one of the affected monitors
    const userMonitors = await Monitor.find({ userId }).select('_id');
    const userMonitorIds = userMonitors.map(m => m._id!.toString());
    const hasAccess = incident.affectedServices.some((service: any) => userMonitorIds.includes(service._id.toString()));
    
    if (!hasAccess) {
      res.status(403).json({ error: 'Unauthorized access to incident' });
      return;
    }

    res.json(incident);
  } catch (err: any) {
    logger.error(`Failed to get incident ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const createIncident = async (req: Request, res: Response): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { userId } = userPayload;

  try {
    logger.info(`User ${userId} attempting to create a new incident.`);
    const { affectedServices, ...restOfBody } = req.body;
    
    // Validate that the user owns all affected monitors
    const monitors = await Monitor.find({ _id: { $in: affectedServices }, userId });
    if (monitors.length !== affectedServices.length) {
      res.status(403).json({ error: 'Unauthorized: You can only create incidents for your own monitors.' });
      return;
    }

    const incident = new Incident({ ...restOfBody, affectedServices });
    await incident.save();
    logger.info(`Successfully created incident with ID: ${incident._id}`);
    res.status(201).json(incident);
  } catch (err: any) {
    logger.error(`Failed to create incident for user ${userId}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};

export const updateIncident = async (req: Request, res: Response): Promise<void> => {
  const userPayload = req.user as { userId: string };
  if (!userPayload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { userId } = userPayload;

  try {
    const { id } = req.params;
    logger.info(`User ${userId} attempting to update incident ${id}`);
    const incident = await Incident.findById(id);

    if (!incident) {
      res.status(404).json({ error: 'Incident not found' });
      return;
    }
    
    // Ensure the user has access to the incident
    const userMonitors = await Monitor.find({ userId }).select('_id');
    const userMonitorIds = userMonitors.map(m => m._id!.toString());
    const hasAccess = incident.affectedServices.some((service: any) => userMonitorIds.includes(service.toString()));
    
    if (!hasAccess) {
      res.status(403).json({ error: 'Unauthorized access to incident' });
      return;
    }
    
    // Update fields
    const updatedIncident = await Incident.findByIdAndUpdate(id, req.body, { new: true });
    logger.info(`Successfully updated incident ${id}`);
    res.json(updatedIncident);
  } catch (err: any) {
    logger.error(`Failed to update incident ${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
};