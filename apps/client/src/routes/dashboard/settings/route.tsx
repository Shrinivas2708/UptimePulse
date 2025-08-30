import { createFileRoute,Outlet,Link, useLocation } from '@tanstack/react-router'
// import { Link } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/dashboard/settings')({
  component: RouteComponent,
})
const data = [{
name:"General",
to:"/dashboard/settings/general",
icon:(<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-round-icon lucide-circle-user-round"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>)
},{
    name:"Delete",
    to:"/dashboard/settings/delete",
    icon:(<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c42121" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>)
}]
function RouteComponent() {
  console.log(useLocation().pathname.split("/")[useLocation().pathname.split("/").length-1].charAt(0).toUpperCase() +useLocation().pathname.split("/")[useLocation().pathname.split("/").length-1].slice(1));
  
    const [active,setActive] = useState<string>(useLocation().pathname.split("/")[useLocation().pathname.split("/").length-1].charAt(0).toUpperCase() +useLocation().pathname.split("/")[useLocation().pathname.split("/").length-1].slice(1))
  return <main className=" space-y-5">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex md:flex-row flex-col  gap-3 md:gap-10 ">
          <div className="flex flex-col ">
            {data.map((v, i) => {
              return (
                <Link
                  to={v.to}
                  className=" flex gap-2 p-2 cursor-pointer items-center"
                  key={i}
                  onClick={() => setActive(v.name)}
                >
                  <div>{v.icon}</div>
                  <p
                    className={
                      active == v.name ? "text-green-500" : "text-white/50"
                    }
                  >
                    {v.name}
                  </p>
                </Link>
              );
            })}
          </div>
            <div className=' w-full'>
            <Outlet />
            </div>
        </div>
      </main>
}
