/* eslint-disable */
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMonitors, updateStatusPage, type IMonitor } from '../../../../api';
import { Route as parentRoute } from './route';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical, X, Pencil } from 'lucide-react'; // ✨ FIX: Imported Pencil
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const Route = createFileRoute('/dashboard/status-pages/$slug/monitors')({
  component: MonitorsSettingsComponent,
});

// Define types for our structure
type CustomMonitor = { _id: string; name: string; description: string; historyDuration: number; };
type MonitorSection = { id: string; name: string; monitors: CustomMonitor[] };

// --- Draggable Monitor Item Component ---

function EditResourceModal({
    isOpen,
    onClose,
    monitor,
    onSave,
  }: {
    isOpen: boolean;
    onClose: () => void;
    monitor: CustomMonitor;
    onSave: (updatedMonitor: CustomMonitor) => void;
  }) {
    const [name, setName] = useState(monitor.name);
    const [description, setDescription] = useState(monitor.description);
    const [duration, setDuration] = useState(monitor.historyDuration || 90);

    if (!isOpen) return null;

    const handleSave = () => {
      onSave({ ...monitor, name, description,historyDuration:duration });
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-[#131211] rounded-lg border border-white/10 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold">Edit Resource</h3>
          <div className="space-y-4 mt-4">
          
            <div>
              <label className="text-sm text-white/70">Public name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-style w-full mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Explanation</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-style w-full mt-1"
                placeholder="Displayed as a help icon. Optional."
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Frequency</label>
              <p className="text-xs text-white/50 mb-2">How many days of uptime history to show.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDuration(7)}
                  className={`px-4 py-2 rounded-md text-sm ${duration === 7 ? 'bg-white text-black' : 'bg-[#292524]'}`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setDuration(30)}
                  className={`px-4 py-2 rounded-md text-sm ${duration === 30 ? 'bg-white text-black' : 'bg-[#292524]'}`}
                >
                  30 Days
                </button>
                <button
                  onClick={() => setDuration(90)}
                  className={`px-4 py-2 rounded-md text-sm ${duration === 90 ? 'bg-white text-black' : 'bg-[#292524]'}`}
                >
                  90 Days
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">Save</button>
          </div>
        </div>
      </div>
    );
  }
  function SortableMonitorItem({ monitor, sectionIndex, monitorIndex, handleRemoveMonitor, onEditClick }: { monitor: CustomMonitor, sectionIndex: number, monitorIndex: number, handleRemoveMonitor: Function, onEditClick: Function }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: monitor._id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 bg-[#0c0a09] p-2 rounded-md border border-white/10">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-white/30" />
            </button>
            <div className="flex-1">
              <p className="font-medium">{monitor.name}</p>
              {monitor.description && <p className="text-xs text-white/50">{monitor.description}</p>}
            </div>
             <button onClick={() => onEditClick(sectionIndex, monitorIndex)} className="p-1 text-white/50 hover:text-white hover:bg-[#292524] rounded">
                <Pencil className="h-4 w-4"/>
            </button>
            <button onClick={() => handleRemoveMonitor(sectionIndex, monitorIndex)} className="p-1 text-red-500 hover:bg-[#292524] rounded">
                <Trash2 className="h-4 w-4"/>
            </button>
        </div>
    );
}
function MonitorsSettingsComponent() {
  const { slug } = Route.useParams();
  const page = parentRoute.useLoaderData();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✨ FIX: Added missing state declaration
  const [editingMonitor, setEditingMonitor] = useState<{ sectionIndex: number, monitorIndex: number } | null>(null);

  const handleEditClick = (sectionIndex: number, monitorIndex: number) => {
    setEditingMonitor({ sectionIndex, monitorIndex });
    setIsModalOpen(true);
  };
  const { data: allMonitors } = useQuery<IMonitor[]>({ queryKey: ['userMonitors'], queryFn: fetchMonitors });
  
  // Initialize sections with unique IDs for dnd-kit
  const [sections, setSections] = useState<MonitorSection[]>(
    (page.monitorSections || [{ name: 'Primary Services', monitors: [] }]).map(
      (s: Omit<MonitorSection, 'id'>, i: number) => ({ ...s, id: `section-${i}-${Date.now()}` })
    )
  );

  const { mutate, isPending } = useMutation({
      mutationFn: (data: { monitorSections: Omit<MonitorSection, 'id'>[] }) => updateStatusPage(slug, data),
      onSuccess: (updatedPage) => {
          toast.success("Monitors updated!");
          queryClient.setQueryData(['statusPage', slug], updatedPage);
      },
      onError: (err) => toast.error(err.message || "Failed to update."),
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddSection = () => {
      setSections(prev => [...prev, { id: `section-${prev.length}-${Date.now()}`, name: `New Section`, monitors: [] }]);
  };

  const handleRemoveSection = (sectionId: string) => {
      setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const handleAddMonitorToSection = (sectionIndex: number, monitorId: string) => {
      const monitor = allMonitors?.find(m => m._id === monitorId);
      if (!monitor) return;

      const newSections = [...sections];
      newSections[sectionIndex].monitors.push({ 
        _id: monitor._id, 
        name: monitor.name, 
        description: '', 
        historyDuration: 90 
    });
      setSections(newSections);
      // setSections(newSections);
  };
  
  const handleRemoveMonitor = (sectionIndex: number, monitorIndex: number) => {
      const newSections = [...sections];
      newSections[sectionIndex].monitors.splice(monitorIndex, 1);
      setSections(newSections);
  };
  
  const handleSaveMonitorDetails = (updatedMonitor: CustomMonitor) => {
    if (editingMonitor) {
      const { sectionIndex, monitorIndex } = editingMonitor;

      // 1. Create the new sections array with the updated data
      const newSections = [...sections];
      newSections[sectionIndex].monitors[monitorIndex] = updatedMonitor;
      
      // 2. Update the local React state for an instant UI change
      setSections(newSections);

      // 3. Prepare the data for the backend (stripping temporary frontend IDs)
      const sectionsToSave = newSections.map(({ id, ...rest }) => rest);
      
      // 4. Call the mutation to save the data to the server
      mutate({ monitorSections: sectionsToSave });
      
      // 5. Close the modal
      setIsModalOpen(false);
    }
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    if (active.id.toString().startsWith('section-') && over.id.toString().startsWith('section-')) {
        setSections((items) => {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
        return;
    }

    const activeSectionIndex = sections.findIndex(s => s.monitors.some(m => m._id === active.id));
    const overSectionIndex = sections.findIndex(s => s.id === over.id || s.monitors.some(m => m._id === over.id));

    if (activeSectionIndex === -1 || overSectionIndex === -1) return;

    const activeMonitorIndex = sections[activeSectionIndex].monitors.findIndex(m => m._id === active.id);
    
    let overMonitorIndex = sections[overSectionIndex].monitors.findIndex(m => m._id === over.id);
    if (overMonitorIndex === -1) {
        overMonitorIndex = sections[overSectionIndex].monitors.length;
    }

    const newSections = [...sections];
    const [movedMonitor] = newSections[activeSectionIndex].monitors.splice(activeMonitorIndex, 1);
    newSections[overSectionIndex].monitors.splice(overMonitorIndex, 0, movedMonitor);
    setSections(newSections);
  }

  const availableMonitors = allMonitors?.filter(m => 
      !sections.flatMap(s => s.monitors).some(sm => sm._id === m._id)
  ) || [];

  const handleSaveChanges = () => {
    const sectionsToSave = sections.map(({ id, ...section }) => ({
      ...section,
      monitors: section.monitors.map(monitor => ({
        ...monitor,
        // Use the existing duration, or default to 90 if it's undefined
        historyDuration: monitor.historyDuration ?? 90,
      })),
    }));
    mutate({ monitorSections: sectionsToSave });
  };

  return (
    <div className="flex flex-col space-y-6 max-w-4xl">
       {editingMonitor !== null && (
        <EditResourceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          monitor={sections[editingMonitor.sectionIndex].monitors[editingMonitor.monitorIndex]}
          onSave={handleSaveMonitorDetails}
        />
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section, sectionIndex) => (
                <SortableSection 
                    key={section.id} 
                    section={section} 
                    sectionIndex={sectionIndex}
                    setSections={setSections}
                    handleRemoveSection={handleRemoveSection}
                    handleRemoveMonitor={handleRemoveMonitor}
                    handleAddMonitorToSection={handleAddMonitorToSection}
                    handleEditClick={handleEditClick} // ✨ FIX: Pass handleEditClick prop
                    availableMonitors={availableMonitors}
                />
            ))}
        </SortableContext>
      </DndContext>

        <button onClick={handleAddSection} className="btn-secondary w-full justify-center">
            <Plus className="h-4 w-4" /> Add Section
        </button>

        <div className="flex justify-end">
            <button onClick={handleSaveChanges} className="btn-primary" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </div>
  );
}

// --- Draggable Section Component ---
function SortableSection({ section, sectionIndex, setSections, handleRemoveSection, handleRemoveMonitor, handleAddMonitorToSection, handleEditClick, availableMonitors }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="bg-[#131211] border border-white/10 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1">
                    <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-5 w-5 text-white/30" />
                    </button>
                    <input 
                        value={section.name}
                        onChange={(e) => {
                            setSections((prev: MonitorSection[]) => {
                                const newSections = [...prev];
                                newSections[sectionIndex].name = e.target.value;
                                return newSections;
                            });
                        }}
                        className="input-style w-full font-semibold bg-transparent border-none"
                    />
                </div>
                <button onClick={() => handleRemoveSection(section.id)} className="p-1 text-red-500 hover:bg-[#292524] rounded ml-2">
                    <X className="h-4 w-4"/>
                </button>
            </div>
            <SortableContext items={section.monitors.map((m: CustomMonitor) => m._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[50px]">
                    {section.monitors.map((monitor: CustomMonitor, monitorIndex: number) => (
                        <SortableMonitorItem 
                            key={monitor._id}
                            monitor={monitor}
                            sectionIndex={sectionIndex}
                            monitorIndex={monitorIndex}
                            handleRemoveMonitor={handleRemoveMonitor}
                            onEditClick={handleEditClick} // ✨ FIX: Pass onEditClick instead of handleMonitorNameChange
                        />
                    ))}
                </div>
            </SortableContext>
            
            <select 
                onChange={(e) => handleAddMonitorToSection(sectionIndex, e.target.value)}
                value=""
                className="input-style w-full"
                disabled={availableMonitors.length === 0}
            >
                <option value="" disabled>+ Search to add resources</option>
                {availableMonitors.map((m: IMonitor) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                ))}
            </select>
        </div>
    );
}