# from fastapi import FastAPI, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from pypdf import PdfReader
# from langchain.text_splitter import CharacterTextSplitter
# from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain_community.vectorstores import Chroma
# from langchain.memory import ConversationBufferMemory
# from langchain.chains import ConversationalRetrievalChain
# import os
# from dotenv import load_dotenv

# load_dotenv()
# api_key = os.getenv("GOOGLE_API_KEY")

# app = FastAPI()

# # Allow requests from mobile app
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Global conversation object
# conversation = None

# # ---------------- Helper Functions ----------------
# def get_pdf_text(pdf_files):
#     text = ""
#     for pdf in pdf_files:
#         pdf_reader = PdfReader(pdf.file)
#         for page in pdf_reader.pages:
#             text += page.extract_text() or ""
#     return text

# def get_text_chunks(text):
#     splitter = CharacterTextSplitter(separator="\n", chunk_size=1000, chunk_overlap=200)
#     return splitter.split_text(text)

# def get_vectorstore(text_chunks):
#     embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
#     return Chroma.from_texts(texts=text_chunks, embedding=embeddings)

# def get_conversation_chain(vectorstore):
#     if not api_key:
#         raise ValueError("GOOGLE_API_KEY not found in environment variables.")
        
#     llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
#     memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
#     return ConversationalRetrievalChain.from_llm(
#         llm=llm,
#         retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
#         memory=memory
#     )

# # ---------------- Endpoints ----------------
# @app.get("/")
# def root():
#     return {"message": "Backend is running!"}

# @app.post("/upload_pdf")
# async def upload_pdf(files: list[UploadFile] = File(...)):
#     global conversation
#     raw_text = get_pdf_text(files)
#     chunks = get_text_chunks(raw_text)
#     vectorstore = get_vectorstore(chunks)
#     conversation = get_conversation_chain(vectorstore)
#     return {"message": "✅ PDFs processed successfully!"}

# class Question(BaseModel):
#     question: str

# @app.post("/ask")
# async def ask_question(data: Question):
#     global conversation
#     if conversation is None:
#         return {"answer": "⚠️ Please upload PDFs first."}

#     response = conversation.invoke({"question": data.question})
#     return {"answer": response["answer"]}







from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
import os, shutil
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

app = FastAPI()

# ✅ CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

conversation = None
VECTOR_DB_DIR = "chroma_db"


def get_pdf_text(pdf_files):
    text = ""
    for pdf in pdf_files:
        pdf_reader = PdfReader(pdf.file)
        for page in pdf_reader.pages:
            text += page.extract_text() or ""
    return text


def get_text_chunks(text):
    splitter = CharacterTextSplitter(separator="\n", chunk_size=1000, chunk_overlap=200)
    return splitter.split_text(text)


def get_vectorstore(text_chunks):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
    return Chroma.from_texts(
        texts=text_chunks,
        embedding=embeddings,
        persist_directory=VECTOR_DB_DIR
    )


def get_conversation_chain(vectorstore):
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro",temperature=0.2)
    memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
        memory=memory
    )


@app.post("/upload_pdf")
async def upload_pdf(files: list[UploadFile] = File(...)):
    global conversation
    raw_text = get_pdf_text(files)
    chunks = get_text_chunks(raw_text)
    vectorstore = get_vectorstore(chunks)
    conversation = get_conversation_chain(vectorstore)
    return {"message": "PDF processed ✅"}


class Question(BaseModel):
    question: str


@app.post("/ask")
async def ask_question(data: Question):
    global conversation
    if conversation is None:
        return {"answer": "⚠️ Upload PDF first!"}

    response = conversation.invoke({"question": data.question})
    return {"answer": response["answer"]}


@app.post("/reset")
async def reset():
    global conversation
    conversation = None

    if os.path.exists(VECTOR_DB_DIR):
        shutil.rmtree(VECTOR_DB_DIR)

    os.makedirs(VECTOR_DB_DIR, exist_ok=True)

    return {"message": "✅ Reset successful — upload again"}
