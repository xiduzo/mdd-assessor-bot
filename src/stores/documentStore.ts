import { StudentDocument } from "@/lib/types";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { create } from "zustand";

interface DocumentStore {
  documents: StudentDocument[];
  add: (document: StudentDocument) => void;
  remove: (document: Pick<StudentDocument, "name">) => void;
}

const key = "documents";

const documentStore = create<DocumentStore>((set) => {
  const init = JSON.parse(localStorage.getItem(key) ?? "[]");

  return {
    documents: init,
    add: (doc) => {
      set((state) => ({ documents: [...state.documents, doc] }));
    },
    remove: (doc) => {
      set((state) => ({
        documents: state.documents.filter((d) => d.name !== doc.name),
      }));
    },
  };
});

export function useDocumentStore(): DocumentStore {
  const [, setDocs] = useLocalStorage<StudentDocument[]>(key, []);

  const { documents, ...rest } = documentStore();

  useEffect(() => {
    setDocs(documents);
  }, [documents]);

  return {
    documents,
    ...rest,
  };
}
