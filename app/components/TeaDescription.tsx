import React from "react";
import TeaDescriptionBlock from "./TeaDescriptionBlock";

type Props = {
  aroma?: string[];
  taste?: string[];
  className?: string;
};

export default function TeaDescription({ className, aroma, taste }: Props) {
  return (
    <div className={"flex gap-[20px] " + className}>
      {aroma && <TeaDescriptionBlock title="Аромат" descriptors={aroma} />}
      {taste && <TeaDescriptionBlock title="Вкус" descriptors={taste} />}
    </div>
  );
}
