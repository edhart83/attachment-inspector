"use client";

import { useState, useCallback, ChangeEvent, DragEvent } from "react";
import NextImage from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  Layers,
  AlertCircle,
  Palette,
  Zap,
  Download,
  Loader2,
  WandSparkles,
  FolderKanban,
  Copy,
  Check,
} from "lucide-react";

// components
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggleDropdown } from "@/components/theme-toggle-dropdown";

import {
  analyzeImage,
  type AnalyzeImageOutput,
} from "@/ai/flows/analyze-image";

type FileDetails = {
  name: string;
  size: string;
  type: string;
  dimensions: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

export default function AttachmentInspectorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const { toast } = useToast();

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileDetails(null);
    setAnalysis(null);
    setError(null);
    setIsProcessing(false);
    setIsAnalyzing(false);
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const processFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setAnalysis(null);
      setPreviewUrl(null);
      setFileDetails(null);
      setSelectedFile(file);

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const errorMsg = `Invalid file type. Please upload a PNG, JPG, GIF, or WEBP image.`;
        setError(errorMsg);
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: `Invalid file type: ${file.type}`,
        });
        setIsProcessing(false);
        setSelectedFile(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File is too large. Maximum size is ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB.`;
        setError(errorMsg);
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "File exceeds maximum size.",
        });
        setIsProcessing(false);
        setSelectedFile(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);

        const img = document.createElement("img");
        img.onload = () => {
          setFileDetails({
            name: file.name,
            size: (file.size / 1024).toFixed(2) + " KB",
            type: file.type,
            dimensions: `${img.width} x ${img.height} px`,
          });

          setIsAnalyzing(true);
          analyzeImage({ photoDataUri: dataUrl })
            .then((output: AnalyzeImageOutput) => {
              setAnalysis(output.description);
            })
            .catch((err) => {
              console.error("AI Analysis Error:", err);
              const analysisErrorMsg =
                "Failed to analyze image. The AI model might be unavailable or encountered an issue.";
              setError((prevError) => prevError || analysisErrorMsg);
              toast({
                variant: "destructive",
                title: "Analysis Error",
                description: "Could not analyze the image.",
              });
              setAnalysis(null);
            })
            .finally(() => {
              setIsAnalyzing(false);
              setIsProcessing(false);
            });
        };
        img.onerror = () => {
          const imgLoadError =
            "Could not load image to get dimensions. The file might be corrupted.";
          setError(imgLoadError);
          toast({
            variant: "destructive",
            title: "Image Load Error",
            description: "Failed to process image properties.",
          });
          setIsProcessing(false);
          setIsAnalyzing(false);
          setPreviewUrl(null);
          setSelectedFile(null);
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        const readError = "Failed to read file.";
        setError(readError);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected file.",
        });
        setIsProcessing(false);
        setSelectedFile(null);
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEvent = (
    event: DragEvent<HTMLDivElement | HTMLLabelElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (isProcessing) return;

    if (event.type === "dragenter" || event.type === "dragover") {
      setDragActive(true);
    } else if (event.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (isProcessing) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const triggerFileInput = () => {
    if (isProcessing) return;
    document.getElementById("fileInput")?.click();
  };

  const copyToClipboard = async () => {
    if (!analysis) return;

    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Analysis text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center w-full max-w-5xl relative">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-primary flex items-center">
              <Palette className="mr-3 h-10 w-10 sm:h-12 sm:w-12 text-primary" />
              UI Attachment Inspector
            </h1>
            <p className="text-muted-foreground mt-2 text-md sm:text-lg">
              Upload an image to generate a prompt for UI design description of
              its notable UI design characteristics.
            </p>
          </div>
          <div className="absolute top-0 right-0">
            <ThemeToggleDropdown />
          </div>
        </header>

        <main className="w-full max-w-5xl space-y-8">
          <Card
            className={`shadow-xl transition-all duration-300 ${
              dragActive
                ? "border-primary ring-2 ring-primary scale-105"
                : "border-border"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <UploadCloud className="mr-2 h-7 w-7 text-primary" /> Upload
                Image
              </CardTitle>
              <CardDescription>
                Drag & drop an image, or click to select. (PNG, JPG, GIF, WEBP,
                max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="fileInput"
                onDragEnter={handleDragEvent}
                onDragLeave={handleDragEvent}
                onDragOver={handleDragEvent}
                onDrop={handleDrop}
                className={`block border-2 border-dashed rounded-lg p-8 text-center group transition-colors
                            ${
                              isProcessing
                                ? "cursor-not-allowed bg-muted/50"
                                : "cursor-pointer hover:border-primary/70 bg-background hover:bg-accent/10"
                            }
                            ${
                              dragActive
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                onClick={isProcessing ? (e) => e.preventDefault() : undefined}
              >
                <Input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                {isProcessing && !previewUrl ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground font-semibold">
                      Processing your image...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please wait a moment.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <UploadCloud
                      className={`h-12 w-12 mb-3 transition-colors ${
                        dragActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary/80"
                      }`}
                    />
                    <p
                      className={`font-semibold transition-colors ${
                        dragActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary/80"
                      }`}
                    >
                      {dragActive
                        ? "Drop the file here!"
                        : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Max file size: 10MB
                    </p>
                  </div>
                )}
              </label>
            </CardContent>
            {error && !isProcessing && (
              <CardFooter className="pt-4 border-t mt-4">
                <p className="text-destructive text-sm flex items-center w-full">
                  <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
                  <span className="flex-grow">{error}</span>
                </p>
              </CardFooter>
            )}
          </Card>

          {previewUrl && selectedFile && fileDetails && (
            <div className="grid md:grid-cols-2 gap-8 pt-6">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <ImageIcon className="mr-2 h-6 w-6 text-primary" /> Image
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-[16/10] rounded-md overflow-hidden border border-border mb-6 bg-muted/20 shadow-inner">
                    <NextImage
                      src={previewUrl}
                      alt={selectedFile.name || "Selected image preview"}
                      layout="fill"
                      objectFit="contain"
                      data-ai-hint="uploaded image"
                    />
                  </div>
                  <div className="font-semibold text-lg mb-2 text-primary">
                    File Details:
                  </div>
                  <ul className="space-y-1.5 text-sm text-foreground list-none">
                    <li>
                      <strong>Name:</strong>{" "}
                      <span className="text-muted-foreground">
                        {fileDetails.name}
                      </span>
                    </li>
                    <li>
                      <strong>Size:</strong>{" "}
                      <span className="text-muted-foreground">
                        {fileDetails.size}
                      </span>
                    </li>
                    <li>
                      <strong>Type:</strong>{" "}
                      <span className="text-muted-foreground">
                        {fileDetails.type}
                      </span>
                    </li>
                    <li>
                      <strong>Dimensions:</strong>{" "}
                      <span className="text-muted-foreground">
                        {fileDetails.dimensions}
                      </span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="border-t mt-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetState}
                    className="w-full text-accent border-accent hover:bg-accent/10 hover:text-accent"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Upload Another
                    Image
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-8">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-xl">
                      <div className="flex items-center">
                        <Zap className="mr-2 h-6 w-6 text-primary" /> Prompt
                        Analysis
                      </div>
                      {analysis && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyToClipboard}
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Notable characteristics UI Components.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="min-h-[180px] text-sm">
                    {isAnalyzing ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="text-sm text-muted-foreground mt-4 flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Inspecting UI Elements...
                        </div>
                      </div>
                    ) : analysis ? (
                      <div className="prose dark:prose-invert max-w-none text-sm">
                        <Markdown>{analysis}</Markdown>
                      </div>
                    ) : error && !isProcessing && !isAnalyzing && !analysis ? (
                      <div className="text-destructive flex items-start">
                        <AlertCircle className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>
                          Analysis could not be completed. The AI model may be
                          unavailable or the image format is unprocessable by
                          the AI.
                        </span>
                      </div>
                    ) : !isProcessing && !selectedFile ? (
                      <p className="text-muted-foreground">
                        Upload an image to start analysis.
                      </p>
                    ) : !isProcessing && selectedFile && !analysis && !error ? (
                      <div className="text-muted-foreground">
                        Ready for analysis, or analysis was not performed.
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Layers className="mr-2 h-6 w-6 text-primary" /> Suggested
                      Actions
                    </CardTitle>
                    <CardDescription>
                      Possible actions for your image (demonstrative).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left group"
                      disabled
                    >
                      <WandSparkles className="mr-2 h-5 w-5 text-accent group-hover:text-accent-foreground" />
                      <div>
                        Enhance Prompt
                        <p className="text-xs text-muted-foreground">
                          Enhance the prompt.
                        </p>
                      </div>
                      <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-sm text-muted-foreground">
                        (Coming Soon)
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left group"
                      disabled
                    >
                      <FolderKanban className="mr-2 h-5 w-5 text-accent group-hover:text-accent-foreground" />
                      <div>
                        Prompt Management
                        <p className="text-xs text-muted-foreground">
                          Manage your prompts.
                        </p>
                      </div>
                      <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-sm text-muted-foreground">
                        (Coming Soon)
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left group"
                      onClick={() =>
                        previewUrl && window.open(previewUrl, "_blank")
                      }
                      disabled={!previewUrl}
                    >
                      <Download className="mr-2 h-5 w-5 text-accent group-hover:text-accent-foreground" />
                      <div>
                        Download Prompt
                        <p className="text-xs text-muted-foreground">
                          Save the uploaded image.
                        </p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UI Attachment Inspector.</p>
        </footer>
      </div>
    </>
  );
}
