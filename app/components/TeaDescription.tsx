import React from "react";
import TeaDescriptionBlock from "./TeaDescriptionBlock";

type Props = {
  aroma?: string[];
  taste?: string[];
  aftertaste?: string[];
  className?: string;
};

export default function TeaDescription({ className, aroma, taste, aftertaste }: Props) {
  /*
   * Пусто всё — не выводим и контейнер.
   *
   * Нашёл justea-catalog, замерив в браузере: у чаёв без фактуры
   * (дянь хун, фу чжуань) блок характеристик пустой, высота 0, а зазор
   * между соседями 80 px — сорок от абзаца выше и сорок от `mb` пустого
   * блока. Поля не слипаются, потому что `display: flex` создаёт свой
   * контекст форматирования и блок не сворачивается сам через себя.
   *
   * Важно, почему это дефект, а не придирка. Пустые характеристики у этих
   * чаёв — правильное состояние: фактуры нет, выдумывать не станем. Но на
   * странице правильное состояние читалось как недоделка: не «у этого чая
   * таких данных нет», а «тут что-то должно было отрисоваться». Решение в
   * данных само до страницы смысла не доносит.
   */
  if (!aroma?.length && !taste?.length && !aftertaste?.length) {
    return null;
  }

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
