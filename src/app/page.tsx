
'use client';

import { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import NextImage from 'next/image'; // Renamed to avoid conflict with Lucide's Image icon
import { UploadCloud, FileText, Image as ImageIcon, Layers, AlertCircle, Palette, Zap, FileCog, Minimize, Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

import { analyzeImage, type AnalyzeImageOutput } from '@/ai/flows/analyze-image';

type FileDetails = {
  name: string;
  size: string;
  type: string;
  dimensions: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export default function AttachmentInspectorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const { toast } = useToast();

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileDetails(null);
    setAnalysis(null);
    setError(null);
    setIsProcessing(false);
    setIsAnalyzing(false);
    // Clear file input visually if possible (tricky without direct ref/form reset)
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setAnalysis(null);
    setPreviewUrl(null);
    setFileDetails(null);
    setSelectedFile(file);

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const errorMsg = `Invalid file type. Please upload a PNG, JPG, GIF, or WEBP image.`;
      setError(errorMsg);
      toast({ variant: "destructive", title: "Upload Error", description: `Invalid file type: ${file.type}` });
      setIsProcessing(false);
      setSelectedFile(null); // Clear invalid file
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024*1024)}MB.`;
      setError(errorMsg);
      toast({ variant: "destructive", title: "Upload Error", description: "File exceeds maximum size." });
      setIsProcessing(false);
      setSelectedFile(null); // Clear invalid file
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);

      const img = document.createElement('img');
      img.onload = () => {
        setFileDetails({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
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
            const analysisErrorMsg = 'Failed to analyze image. The AI model might be unavailable or encountered an issue.';
            setError(prevError => prevError || analysisErrorMsg); // Show analysis error if no upload error
            toast({ variant: "destructive", title: "Analysis Error", description: "Could not analyze the image." });
            setAnalysis(null);
          })
          .finally(() => {
            setIsAnalyzing(false);
            setIsProcessing(false); 
          });
      };
      img.onerror = () => {
        const imgLoadError = 'Could not load image to get dimensions. The file might be corrupted.';
        setError(imgLoadError);
        toast({ variant: "destructive", title: "Image Load Error", description: "Failed to process image properties." });
        setIsProcessing(false);
        setIsAnalyzing(false);
        setPreviewUrl(null); // Clear preview if image can't load
        setSelectedFile(null);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      const readError = 'Failed to read file.';
      setError(readError);
      toast({ variant: "destructive", title: "File Read Error", description: "Could not read the selected file." });
      setIsProcessing(false);
      setSelectedFile(null);
    };
    reader.readAsDataURL(file);
  }, [toast]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEvent = (event: DragEvent<HTMLDivElement | HTMLLabelElement>) => {
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
    document.getElementById('fileInput')?.click();
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary flex items-center justify-center">
            <Palette size={40} className="mr-3 sm:size-48" />
            Attachment Inspector
          </h1>
          <p className="text-muted-foreground mt-2 text-md sm:text-lg">
            Upload an image to view its details and receive AI-powered analysis.
          </p>
        </header>

        <main className="w-full max-w-5xl space-y-8">
          <Card className={`shadow-xl transition-all duration-300 ${dragActive ? "border-primary ring-2 ring-primary scale-105" : "border-border"}`}>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <UploadCloud className="mr-2 h-7 w-7 text-primary" /> Upload Image
              </CardTitle>
              <CardDescription>Drag & drop an image, or click to select. (PNG, JPG, GIF, WEBP, max 10MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="fileInput"
                onDragEnter={handleDragEvent} 
                onDragLeave={handleDragEvent} 
                onDragOver={handleDragEvent} 
                onDrop={handleDrop}
                className={`block border-2 border-dashed rounded-lg p-8 text-center group transition-colors
                            ${isProcessing ? 'cursor-not-allowed bg-muted/50' : 'cursor-pointer hover:border-primary/70 bg-background hover:bg-accent/10'}
                            ${dragActive ? 'border-primary bg-primary/10' : 'border-border'}`}
                onClick={isProcessing ? (e) => e.preventDefault() : undefined} // Prevent click when processing
              >
                <Input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                {isProcessing && !previewUrl ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
                    <p className="text-muted-foreground font-semibold">Processing your image...</p>
                    <p className="text-sm text-muted-foreground">Please wait a moment.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <UploadCloud className={`h-12 w-12 mb-3 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`} />
                    <p className={`font-semibold transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`}>
                      {dragActive ? "Drop the file here!" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-sm text-muted-foreground">Max file size: 10MB</p>
                  </div>
                )}
              </label>
            </CardContent>
            {error && !isProcessing && ( // Only show error if not currently processing something else
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
                    <ImageIcon className="mr-2 h-6 w-6 text-primary" /> Image Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-[16/10] rounded-md overflow-hidden border border-border mb-6 bg-muted/20 shadow-inner">
                    <NextImage src={previewUrl} alt={selectedFile.name || "Selected image preview"} layout="fill" objectFit="contain" data-ai-hint="uploaded image" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">File Details:</h3>
                  <ul className="space-y-1.5 text-sm text-foreground list-none">
                    <li><strong>Name:</strong> <span className="text-muted-foreground">{fileDetails.name}</span></li>
                    <li><strong>Size:</strong> <span className="text-muted-foreground">{fileDetails.size}</span></li>
                    <li><strong>Type:</strong> <span className="text-muted-foreground">{fileDetails.type}</span></li>
                    <li><strong>Dimensions:</strong> <span className="text-muted-foreground">{fileDetails.dimensions}</span></li>
                  </ul>
                </CardContent>
                <CardFooter className="border-t mt-4 pt-4">
                  <Button variant="outline" size="sm" onClick={resetState} className="w-full text-accent border-accent hover:bg-accent/10 hover:text-accent">
                    <UploadCloud className="mr-2 h-4 w-4"/> Upload Another Image
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-8">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Zap className="mr-2 h-6 w-6 text-primary" /> AI Analysis
                    </CardTitle>
                    <CardDescription>Notable characteristics and potential issues identified by AI.</CardDescription>
                  </CardHeader>
                  <CardContent className="min-h-[180px] text-sm">
                    {isAnalyzing ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-3/4" />
                        <p className="text-sm text-muted-foreground mt-4 flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> AI is inspecting your image...
                        </p>
                      </div>
                    ) : analysis ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-foreground">{analysis}</p>
                    ) : error && !isProcessing && !isAnalyzing && !analysis ? ( 
                        <div className="text-destructive flex items-start">
                            <AlertCircle className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" /> 
                            <span>Analysis could not be completed. The AI model may be unavailable or the image format is unprocessable by the AI.</span>
                        </div>
                    ) : !isProcessing && !selectedFile ? (
                      <p className="text-muted-foreground">Upload an image to start analysis.</p>
                    ) : !isProcessing && selectedFile && !analysis && !error ? (
                      <p className="text-muted-foreground">Ready for analysis, or analysis was not performed.</p>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Layers className="mr-2 h-6 w-6 text-primary" /> Suggested Actions
                    </CardTitle>
                    <CardDescription>Possible actions for your image (demonstrative).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-left group" disabled>
                      <FileCog className="mr-2 h-5 w-5 text-accent group-hover:text-accent-foreground" /> 
                      <div>
                        Convert to PNG
                        <p className="text-xs text-muted-foreground">Change image format.</p>
                      </div>
                      <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-sm text-muted-foreground">(Coming Soon)</span>
                    </Button>
                     <Button variant="outline" className="w-full justify-start text-left group" disabled>
                      <Minimize className="mr-2 h-5 w-5 text-accent group-hover:text-accent-foreground" /> 
                      <div>
                        Optimize Size
                        <p className="text-xs text-muted-foreground">Reduce file size without quality loss.</p>
                      </div>
                      <span className="ml-auto text-xs bg-muted px-2 py-1 rounded-sm text-muted-foreground">(Coming Soon)</span>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-left group" onClick={() => previewUrl && window.open(previewUrl, '_blank')} disabled={!previewUrl}>
                      <Download className="mr-2 h-5 w-5 text-accent group-hover:text-accent-foreground" /> 
                      <div>
                        Download Original
                        <p className="text-xs text-muted-foreground">Save the uploaded image.</p>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Attachment Inspector. Powered by Next.js & AI.</p>
        </footer>
      </div>
    </>
  );
}
