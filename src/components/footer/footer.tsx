// import FeedBackForm from "./feedbackForm";
import { Fa6BrandsXTwitter } from "@/components/ui/icons/x-dot-com-icon";
import { Fa6BrandsDiscord } from "../ui/icons/discord-icon";
import { Fa6BrandsGithub } from "../ui/icons/github-icon";
export default function Footer() {
  return (
    <div className="flex w-full max-w-[1280px] px-[16px] py-[32px] lg:mx-auto">
      <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row md:items-end md:gap-0">
        <nav className="flex gap-x-4 text-[14px] text-muted-foreground ">
          <a
            className="hover:text-foreground"
            href="https://sir.trading"
            target="_blank"
          >
            Homepage
          </a>
          <a
            className="hover:text-foreground"
            href="https://docs.sir.trading"
            target="_blank"
          >
            Docs
          </a>
          <a
            className="hover:text-foreground"
            href="https://www.sir.trading/audits/egis"
            target="_blank"
          >
            Audit
          </a>
          <a
            className="hover:text-foreground"
            href="https://docs.sir.trading/protocol-overview/contract-addresses"
            target="_blank"
          >
            Contract addresses
          </a>
        </nav>
        <nav className="flex items-center gap-x-4 text-[14px] text-muted-foreground ">
          <a
            className="p-2 hover:text-foreground"
            href="https://x.com/leveragesir"
            target="_blank"
          >
            <Fa6BrandsXTwitter width={24} height={24} />
          </a>
          <a
            className="p-2 hover:text-foreground"
            href="https://discord.gg/M2SRBDPUR2"
            target="_blank"
          >
            <Fa6BrandsDiscord width={24} height={24} />
          </a>
          <a
            className="p-2 hover:text-foreground"
            href="https://github.com/SIR-trading"
            target="_blank"
          >
            <Fa6BrandsGithub width={24} height={24} />
          </a>
        </nav>
      </div>
    </div>
  );
}

{
  /* <nav className="flex gap-x-4 text-[14px] text-muted-foreground "> */
}
{
  /*   <a className="hover:text-foreground" href=""> */
}
{
  /*     About */
}
{
  /*   </a> */
}
{
  /*   <a className="hover:text-foreground" href=""> */
}
{
  /*     Roadmap */
}
{
  /*   </a> */
}
{
  /*   <a className="hover:text-foreground" href=""> */
}
{
  /*     Whitepaper */
}
{
  /*   </a> */
}
{
  /* </nav> */
}
