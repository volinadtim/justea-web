"use client";

import React from "react";

function DefaultValueComponent({ value }: { value: any }) {
  return (
    <div className="text-center leading-none font-comfortaa font-[14px] font-bold">
      {value}
    </div>
  );
}

type Props<T = string | number> = {
  values: T[];
  icon: React.ComponentType<any>;
  valueComponent?: React.ComponentType<any>;
};

function SteepsTableRow<T>({ values, icon, valueComponent }: Props<T>) {
  const Icon = icon;
  const ValueComponent = valueComponent ?? DefaultValueComponent; // ?? <></>;

  return (
    <div className="flex gap-[33px] items-center">
      <div className="">
        <Icon />
      </div>
      <div className="flex gap-[16px]">
        {values.map((i, index) => (
          <div className="shrink w-[29px] basis-[29px]" key={index}>
            <ValueComponent value={values[index]} />
            {/* {values[index]} */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SteepsTableRow;
