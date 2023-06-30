

import { loadQARefineChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

const openAIApiKey = "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";

async function run() {
  // Create the models and chain
  const embeddings = new OpenAIEmbeddings({openAIApiKey});
  const model = new OpenAI({ temperature: 0,openAIApiKey });
  const chain = loadQARefineChain(model);

  // Load the documents and create the vector store
  const loader = new TextLoader("doc/doc.txt");
  const docs = await loader.loadAndSplit();
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  console.log(await loader.loadAndSplit())

  // Select the relevant documents
  const question = "Who is Nomen";
  const relevantDocs = await store.similaritySearch(question);

  // Call the chain
  const res = await chain.call({
    input_documents: relevantDocs,
    question,
  });
  console.log(res);
  return res;
  /*
  {
    output_text:string}
  */
}

run();

export default async function() {
  try{
    let res = await run();
    console.log(res)
    return new Response(res.output_text,{status:200})
  }catch(err){
    console.log(err)
  }
  
};

export const config = { path: "/hello" };
