import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/integrations/')({
  beforeLoad:()=>{
    throw redirect({to:"/dashboard/integrations/email"})
  }
});


