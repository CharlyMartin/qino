import type { QinoImage } from "@qino/cms";

import { Byline } from "@/components/marketing/byline";

type PostAuthorProps = {
  name: string;
  image: QinoImage;
  company: string;
  role: string;
};

export function PostAuthor({ name, image, company, role }: PostAuthorProps) {
  return (
    <Byline name={name} image={image.src}>
      {role} @ {company}
    </Byline>
  );
}
