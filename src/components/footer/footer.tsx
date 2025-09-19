// import FeedBackForm from "./feedbackForm";
import { Fa6BrandsXTwitter } from "@/components/ui/icons/x-dot-com-icon";
import { Fa6BrandsDiscord } from "../ui/icons/discord-icon";
import { Fa6BrandsTelegram } from "../ui/icons/telegram-icon";
import { Fa6BrandsGithub } from "../ui/icons/github-icon";
import NetworkBadge from "../networkBadge";
export default function Footer() {
  return (
    <div className="flex w-full max-w-[1280px] px-[16px] py-[32px] lg:mx-auto">
      <div className="flex w-full items-center justify-between">
        <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row md:items-center md:gap-0">
          <nav className="flex gap-x-4 text-[14px] text-muted-foreground">
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
              Contracts
            </a>
            <a
              className="hover:text-foreground"
              href="https://docs.sir.trading/protocol-overview/user-risks/bug-bounty"
              target="_blank"
            >
              Bug Bounty
            </a>
          </nav>

          {/* Network badge for medium screens (768px - 1580px) */}
          <div className="hidden md:block custom-lg:hidden">
            <NetworkBadge variant="full" className="max-w-[180px]" />
          </div>

          <nav className="flex items-center gap-x-4 text-[14px] text-muted-foreground">
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
              href="https://t.me/leveragesir"
              target="_blank"
            >
              <Fa6BrandsTelegram width={24} height={24} />
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
