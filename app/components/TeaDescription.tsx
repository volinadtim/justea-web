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
    <div className={"flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5 " + (className ?? "")}>
      {aroma?.length ? (
        <TeaDescriptionBlock title="Аромат" descriptors={aroma} />
      ) : null}
      {taste?.length ? (
        <TeaDescriptionBlock title="Вкус" descriptors={taste} />
      ) : null}
      {aftertaste?.length ? (
        <TeaDescriptionBlock title="Послевкусие" descriptors={aftertaste} />
      ) : null}
    </div>
  );
}
