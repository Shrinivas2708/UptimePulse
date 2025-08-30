import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    fetchNotificationConfigs, 
    fetchIntegrations, 
    createNotificationConfig, 
    deleteNotificationConfig,
    type IIntegration,
    type INotificationConfig
} from '../../../../api';
import { Mail, MessageSquare, Webhook, ShieldAlert, Users, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@headlessui/react';
import { AxiosError } from 'axios';

// Helper to get an icon for each integration type
const getIcon = (type: string) => {
    switch (type) {
        case 'email': return <Mail className="h-5 w-5 text-white/70" />;
        case 'discord': return <MessageSquare className="h-5 w-5 text-indigo-400" />;
        case 'slack': return <MessageSquare className="h-5 w-5 text-purple-400" />;
        case 'teams': return <Users className="h-5 w-5 text-blue-400" />;
        case 'googlechat': return <MessageSquare className="h-5 w-5 text-green-400" />;
        case 'pagerduty': return <ShieldAlert className="h-5 w-5 text-green-500" />;
        case 'telegram': return <Send className="h-5 w-5 text-sky-400" />;
        case 'twiliosms': return <MessageSquare className="h-5 w-5 text-red-500" />;
        default: return <Webhook className="h-5 w-5 text-white/70" />;
    }
}

// Helper to display relevant details for each integration
const getIntegrationDetails = (integration: IIntegration) => {
    switch(integration.type) {
        case 'email': return integration.details.email;
        case 'pagerduty': return `Key: ******${integration.details.integrationKey?.slice(-4)}`;
        case 'telegram': return `Chat ID: ${integration.details.chatId}`;
        case 'twiliosms': return `From: ${integration.details.fromNumber}`;
        default: return integration.details.webhookUrl;
    }
}

export const Route = createFileRoute('/dashboard/monitors/$monitorId/notifications')({
  component: NotificationsComponent,
});

function NotificationsComponent() {
    const { monitorId } = Route.useParams();
    const queryClient = useQueryClient();

    const { data: allIntegrations, isLoading: isLoadingIntegrations } = useQuery<IIntegration[]>({
        queryKey: ['integrations'],
        queryFn: fetchIntegrations,
    });

    const { data: enabledConfigs, isLoading: isLoadingConfigs } = useQuery<INotificationConfig[]>({
        queryKey: ['notificationConfigs', monitorId],
        queryFn: () => fetchNotificationConfigs(monitorId),
    });

    const { mutate: addConfig, isPending: isAdding } = useMutation({
        mutationFn: (integrationId: string) => createNotificationConfig(monitorId, integrationId),
        onSuccess: () => {
            toast.success("Notification enabled for this monitor.");
            queryClient.invalidateQueries({ queryKey: ['notificationConfigs', monitorId] });
        },
        onError: (err) => {if(err instanceof AxiosError) toast.error(err.response?.data?.error || "Failed to enable notification.")},
    });
    
    const { mutate: removeConfig, isPending: isRemoving } = useMutation({
        mutationFn: (configId: string) => deleteNotificationConfig(monitorId, configId),
        onSuccess: () => {
            toast.success("Notification disabled for this monitor.");
            queryClient.invalidateQueries({ queryKey: ['notificationConfigs', monitorId] });
        },
        onError: (err) => toast.error(err.message || "Failed to disable notification."),
    });

    const handleToggle = (checked: boolean, integration: IIntegration) => {
        if (checked) {
            addConfig(integration._id);
        } else {
            const configToRemove = enabledConfigs?.find(c => c.integrationId?._id === integration._id);
            if (configToRemove) {
                removeConfig(configToRemove._id);
            }
        }
    };
    
    const isLoading = isLoadingIntegrations || isLoadingConfigs;

    return (
        <div className="bg-[#131211] border border-white/10 rounded-lg p-6 ">
            <div className="flex md:justify-between flex-col md:flex-row md:gap-0 gap-5 items-start">
                <div>
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    <p className="text-sm max-w-3xl text-white/50 mt-1">
                        Enable or disable your configured integrations for this monitor. To add new channels, visit the Integrations page.
                    </p>
                </div>
                <Link to="/dashboard/integrations" className="btn-primary whitespace-nowrap">
                    Configure Integrations
                </Link>
            </div>
            <div className="mt-6 space-y-3">
                {isLoading ? (
                    <p className="text-white/50">Loading notification settings...</p>
                ) : allIntegrations && allIntegrations.length > 0 ? (
                    allIntegrations.map(integration => {
                        const isEnabled = enabledConfigs?.some(c => c.integrationId?._id === integration._id) ?? false;
                        const isMutating = isAdding || isRemoving;

                        return (
                            // ✨ FIX: Use the unique integration._id as the key
                            <div key={integration._id} className="flex justify-between items-center bg-[#0c0a09] p-3 rounded-md border border-white/10">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {getIcon(integration.type)}
                                    <div className='overflow-hidden'>
                                        <p className="font-medium capitalize">{integration.name}</p>
                                        <p className="text-xs text-white/50 truncate">{getIntegrationDetails(integration)}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    onChange={(checked) => handleToggle(checked, integration)}
                                    disabled={isMutating}
                                    className={`${isEnabled ? 'bg-green-600' : 'bg-gray-600'}
                                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75 disabled:opacity-50`}
                                >
                                    <span
                                        className={`${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                                    />
                                </Switch>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-sm text-white/50 py-8">
                        <p>No integrations have been configured yet.</p>
                        <Link to="/dashboard/integrations" className="text-green-500 hover:underline mt-1">
                            Go to Integrations to add one.
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
