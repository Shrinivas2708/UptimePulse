import { useState } from "react";

const faqData : FaqData[]= [
    {
      question: "What kind of services can I monitor?",
      answer: "You can monitor any service with a public URL. This includes websites, API endpoints, servers, and any other HTTP/HTTPS service. You can customize the request method, headers, and body to monitor virtually anything."
    },
    {
      question: "How do the custom domains for status pages work?",
      answer: "It's simple! You add your desired subdomain (like status.yourcompany.com) in your settings. Then, you create a CNAME record in your DNS provider that points to our servers. We handle the rest, including automatic SSL certificate generation."
    },
    {
      question: "Can I schedule maintenance to avoid false alerts?",
      answer: "Yes! You can create maintenance windows for any of your monitors. During these periods, monitoring will be paused, so you won't receive unnecessary alerts while you're working on your systems."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards. Our payment processing is handled by Stripe, so your information is always secure."
    },
    {
      question: "Can I change my plan later?",
      answer: "Absolutely. You can upgrade or downgrade your plan at any time from your account dashboard."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Our Free plan is the best way to try out our core features. It's free forever, and you can upgrade whenever you need more power."
    }
  ];
  type FaqData = {
    question:string,
    answer:string
  }
  type AccordionType = {
    item:FaqData,
    isOpen:boolean,
    onClick: ()=>void
  }
  const AccordionItem = ({ item, isOpen, onClick } : AccordionType) => {
    return (
      <div className="border-b border-white/10 py-3 px-3 w-full ">
        <button
          onClick={onClick}
          className="w-full flex justify-between items-center text-left"
        >
          <h3 className="text-base font-medium text-white">{item.question}</h3>
          <span className={`text-green-500 text-2xl transform transition-transform duration-300 ${isOpen ? " rotate-45":""}`}>
            {/* {isOpen ? '-' : '+'} */} {'+'}
          </span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-4' : 'max-h-0'}`}
        >
          <p className="text-white/70 text-sm">
            {item.answer}
          </p>
        </div>
      </div>
    );
  };
export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number>();

    const handleItemClick = (index: number) => {
      // If the clicked item is already open, close it. Otherwise, open it.
      setOpenIndex(openIndex === index ? NaN : index);
    };
  
  return <section className="flex flex-col lg:flex-row p-5 sm:p-10 text-balance mt-10 md:mt-16  items-start lg:items-center justify-start px-10  xl:px-32 ">
  <div className="flex flex-col gap-5 md:gap-6 items-start justify-start ">
    <div className="inline-block px-4 py-1.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-sm font-medium  ">
      <span>FAQ</span>
    </div>
    <div className="text-3xl md:text-4xl  font-semibold text-wrap">
      <p>
      Frequently Asked Questions
      </p>
    </div>
    <div className="max-w-sm md:max-w-lg text-white/60 text-sm md:text-base text-wrap">
      <p>
      Have some more questions to ask? feel free to <span className="text-[#22c55e] hover:underline cursor-pointer">contact us</span> 
      </p>
    </div>
  </div>
  <div className=" grid  gap-3 p-1 lg:p-10 pt-16 md:pt-10 w-full max-w-3xl ">
  
          {faqData.map((item, index) => (
            
            <AccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onClick={() => handleItemClick(index)}
            />
          ))}
        
  </div>
</section>
}
