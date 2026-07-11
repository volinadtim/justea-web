import React from "react";
import TeaDescriptionBlock from "./TeaDescriptionBlock";

type Props = {
  aroma?: string[];
  taste?: string[];
  aftertaste?: string[];
  className?: string;
};

export default function TeaDescription({ className, aroma, taste, aftertaste }: Props) {
  return (
    <div className={"flex flex-col gap-[20px] sm:flex-row " + (className ?? "")}>
      {aroma && <TeaDescriptionBlock title="Аромат" descriptors={aroma} />}
      {taste && <TeaDescriptionBlock title="Вкус" descriptors={taste} />}
      {aftertaste && (
        <TeaDescriptionBlock title="Послевкусие" descriptors={aftertaste} />
      )}
    </div>
  );
}
