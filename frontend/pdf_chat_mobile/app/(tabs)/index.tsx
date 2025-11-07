// import React, { useState } from "react";
// import { View, Text, Button, TextInput, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
// import * as DocumentPicker from "expo-document-picker";
// import axios from "axios";

// interface ChatMessage {
//   user: string;
//   bot: string;
// }

// export default function App() {
//   const [pdfFiles, setPdfFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
//   const [question, setQuestion] = useState("");
//   const [chat, setChat] = useState<ChatMessage[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   // IMPORTANT: Replace this with your PC's local IP address.
// const backendURL = "http://192.168.0.103:8000";
 

//   const pickPDF = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: "application/pdf",
//         copyToCacheDirectory: true,
//         multiple: true,
//       });
//       if (result.assets && result.assets.length > 0) {
//         setPdfFiles((prev) => [...prev, ...result.assets]);
//         uploadPDF(result.assets); // Automatically upload after picking
//       }
//     } catch (err) {
//       console.log("Document pick error:", err);
//     }
//   };

//   const uploadPDF = async (filesToUpload: DocumentPicker.DocumentPickerAsset[]) => {
//     if (filesToUpload.length === 0) {
//       alert("No files to upload!");
//       return;
//     }
//     setIsLoading(true);
//     const formData = new FormData();
//     filesToUpload.forEach((file) => {
//       formData.append("files", {
//         uri: file.uri,
//         type: "application/pdf",
//         name: file.name,
//       } as any);
//     });

//     try {
//       const res = await axios.post(`${backendURL}/upload_pdf`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       alert(res.data.message);
//       setPdfFiles([]);
//     } catch (err) {
//       console.log("Upload error:", err);
//       alert("Upload failed! Make sure the backend server is running and the IP address is correct.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const askQuestion = async () => {
//     if (!question || isLoading) return;
//     setIsLoading(true);
//     try {
//       const res = await axios.post(`${backendURL}/ask`, { question });
//       setChat([...chat, { user: question, bot: res.data.answer }]);
//       setQuestion("");
//     } catch (err) {
//       console.log("Ask question error:", err);
//       alert("Failed to get answer. Make sure the backend server is running.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Button title="Pick and Process PDF" onPress={pickPDF} disabled={isLoading} />

//       {isLoading && <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 10 }} />}

//       {pdfFiles.length > 0 && !isLoading && (
//         <View style={{ marginVertical: 10 }}>
//           <Text style={{ fontWeight: "bold" }}>Selected PDFs:</Text>
//           {pdfFiles.map((file, index) => (
//             <Text key={index}>{file.name}</Text>
//           ))}
//         </View>
//       )}

//       <ScrollView style={{ marginVertical: 20, flex: 1 }}>
//         {chat.map((msg, index) => (
//           <View key={index} style={{ marginBottom: 10 }}>
//             <Text style={{ fontWeight: "bold" }}>You: {msg.user}</Text>
//             <Text>AI: {msg.bot}</Text>
//           </View>
//         ))}
//       </ScrollView>

//       <TextInput
//         placeholder="Ask a question..."
//         value={question}
//         onChangeText={setQuestion}
//         style={styles.textInput}
//         editable={!isLoading}
//       />
//       <Button title="Ask" onPress={askQuestion} disabled={isLoading} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
//     title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
//     textInput: {
//         borderWidth: 1,
//         borderColor: "gray",
//         padding: 10,
//         marginBottom: 10,
//         width: '100%'
//     }
// });




// // 




import React, { useState } from "react";
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, KeyboardAvoidingView,
  Platform
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axios from "axios";

interface ChatMessage {
  user: string;
  bot: string;
}

export default function App() {
  const [pdfFiles, setPdfFiles] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const backendURL = "http://10.109.55.55"; // your IPsa

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const files = result.assets;
      setPdfFiles(files);
      uploadPDF(files);
    }
  };

  const uploadPDF = async (files: any[]) => {
    setIsLoading(true);
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        name: file.name || `file-${Date.now()}.pdf`,
        type: "application/pdf",
      } as any);
    });

    try {
      await axios.post(`${backendURL}/upload_pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ PDF Uploaded");
    } catch (e) {
      alert("❌ Upload failed. Check backend/IP.");
    }
    setIsLoading(false);
  };

  const askQuestion = async () => {
    if (!question) return;
    setIsLoading(true);

    try {
      const res = await axios.post(`${backendURL}/ask`, { question });
      setChat((prev) => [...prev, { user: question, bot: res.data.answer }]);
      setQuestion("");
    } catch {
      alert("⚠️ Server error");
    }
    setIsLoading(false);
  };

  const resetAll = async () => {
    try {
      await axios.post(`${backendURL}/reset`);
      setChat([]);
      setPdfFiles([]);
      setQuestion("");
      alert("✅ Chat & PDFs reset — Upload again");
    } catch {
      alert("✅ Chat & PDFs reset — Upload again");
      // alert("❌ Reset failed");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        
        <TouchableOpacity style={styles.button} onPress={pickPDF}>
          <Text style={styles.btnText}>📄 Select PDF</Text>
        </TouchableOpacity>

        {pdfFiles.length > 0 && (
          <View style={{ marginVertical: 10 }}>
            <Text style={{ fontWeight: "bold" }}>Uploaded:</Text>
            {pdfFiles.map((f, i) => <Text key={i}>• {f.name}</Text>)}
          </View>
        )}

        <TouchableOpacity style={styles.resetBtn} onPress={resetAll}>
          <Text style={styles.btnText}>♻️ Reset</Text>
        </TouchableOpacity>

        <ScrollView style={styles.chatBox}>
          {chat.map((msg, i) => (
            <View key={i}>
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{msg.user}</Text>
              </View>
              <View style={styles.botBubble}>
                <Text style={styles.botText}>{msg.bot}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {isLoading && <ActivityIndicator size="large" />}

        <View style={styles.row}>
          <TextInput
            placeholder="Ask something..."
            value={question}
            onChangeText={setQuestion}
            style={styles.input}
          />
          <TouchableOpacity style={styles.askBtn} onPress={askQuestion}>
            <Text style={{ color: "#fff" }}>Ask</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  button: { backgroundColor: "#007AFF", padding: 12, borderRadius: 10, marginBottom: 10 },
  resetBtn: { backgroundColor: "#E63946", padding: 12, borderRadius: 10, marginBottom: 10 },
  btnText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  chatBox: { flex: 1, marginVertical: 10 },

  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    padding: 10,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: "80%"
  },
  userText: { color: "#000" },

  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E7E7E7",
    padding: 10,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: "80%"
  },
  botText: { color: "#000" },

  row: { flexDirection: "row" },
  input: { flex: 1, borderWidth: 1, padding: 10, borderRadius: 10 },
  askBtn: { backgroundColor: "green", padding: 12, borderRadius: 10, marginLeft: 5 }
});
