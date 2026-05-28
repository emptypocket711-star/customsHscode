import { PageHeading } from "@/components/page-heading";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DocumentUploadPanel } from "@/features/documents/document-upload-panel";
import { getDocumentsDictionary } from "@/lib/i18n";
import { resolveCurrentUserLocale } from "@/lib/i18n/server";
import { requireDeveloperRole } from "@/server/auth/role-guard";

export default async function DocumentUploadPage() {
  const guard = await requireDeveloperRole();
  const dictionary = getDocumentsDictionary(await resolveCurrentUserLocale());

  if (!guard.allowed) {
    return (
      <>
        <PageHeading
          title={dictionary.upload.title}
          description={dictionary.upload.description}
        />
        <Card>
          <CardHeader
            title={dictionary.upload.notReadyTitle}
            description={dictionary.upload.notReadyDescription}
          />
          <CardBody>
            <p className="text-sm leading-6 text-slate-600">
              {dictionary.upload.notReadyBody}
            </p>
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeading title={dictionary.upload.title} description={dictionary.upload.developerDescription} />
      <DocumentUploadPanel />
    </>
  );
}
