"use client";
import { MintOrBurnForm } from "@/components/proto/forms/mintOrBurnForm";
import { UniswapV2Form } from "@/components/proto/forms/uniswapV2Form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function page() {
  return (
    <div>
      <h1 className="from-pink-500 to-violet-500 bg-gradient-to-b bg-clip-text text-center text-5xl font-bold text-transparent">
        PROTOTYPE
      </h1>
      <div className=" flex justify-center  pt-20 ">
        <Tabs defaultValue="mintWeth" className="w-1/2">
          <TabsList className="">
            <TabsTrigger value="mintWeth">Swap & Mint</TabsTrigger>
            <TabsTrigger value="uniswap">Uniswap</TabsTrigger>
          </TabsList>
          <TabsContent value="mintWeth">
            <MintOrBurnForm />
          </TabsContent>
          <TabsContent value="uniswap">
            <UniswapV2Form />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
