import { Section } from "@/components/landing/section";
import { SpecRow } from "@/components/landing/spec-row";
import { SpecTable } from "@/components/landing/spec-table";
import { Title } from "@/components/landing/title";

export function FaqSection() {
  return (
    <Section aria-labelledby="faq-heading">
      <Title id="faq-heading">Questions</Title>
      <SpecTable>
        <SpecRow
          label="Do it myself"
          title="Why not swap to Content Collections myself?"
        >
          You can, and it's a good library. A swap changes the loader. You still
          spend the days, and your editors still file tickets. This week also
          types the links between your content so broken ones fail the build,
          and puts your editors on Qino Cloud. Someone else does it.
        </SpecRow>
        <SpecRow label="Overrun" title="What if it takes longer than a week?">
          Then I absorb it. The price is fixed for the scope above. If your repo
          is bigger than that, you'll know before you pay anything, because the
          quote comes first.
        </SpecRow>
        <SpecRow
          label="Next 16"
          title="Does this upgrade my whole app to Next.js 16?"
        >
          It gets your content routes building on 16 and removes Contentlayer as
          the blocker. Changes to the rest of your app, such as Cache Components
          or other routes, are quoted separately if you want them.
        </SpecRow>
        <SpecRow
          label="Cloud"
          title="What is Qino Cloud, and do we have to use it?"
        >
          It's a browser editor for your Markdown that saves to GitHub as a
          commit or a PR. It opens to founding clients in early 2027. Your seat
          is included free for 3 months. After that it's $39 per project per
          month, and you can cancel anytime. qino itself is free and MIT.
        </SpecRow>
        <SpecRow label="Access" title="Do you need access to our repo?">
          Yes, to a branch. You add me as an outside collaborator for the week
          and remove me after the merge.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
