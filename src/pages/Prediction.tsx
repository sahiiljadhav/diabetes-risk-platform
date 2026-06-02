import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Activity, 
  Info, 
  ChevronRight, 
  RefreshCcw, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  BrainCircuit,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { predictDiabetes } from '../services/api';
import Loader from '../components/Loader';
import { cn, getRiskColor } from '../utils/helpers';

interface PredictionFormData {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigreeFunction: number;
  Age: number;
}

interface PredictionResult {
  prediction: string;
  probability: number;
  risk_level: string;
  recommendations?: Array<{
    category: string;
    priority: string;
    title: string;
    message: string;
    actionUrl?: string;
    icon: string;
  }>;
  quickActions?: string[];
  metadata?: {
    generatedAt: string;
    disclaimerVersion: string;
    source: string;
  };
}

const Prediction: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PredictionFormData>({
    defaultValues: {
      Pregnancies: 0,
      Glucose: 100,
      BloodPressure: 70,
      Insulin: 80,
      BMI: 25,
      DiabetesPedigreeFunction: 0.47,
      Age: 30,
    }
  });

  // Pregnancies is always sent as 0 to the ML model (model expects 7 features) but hidden from UI

  const onSubmit = async (data: PredictionFormData) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Simulate network delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      const response = await predictDiabetes(data);
      setResult(response);
      toast.success('Analysis completed successfully');
    } catch (error) {
      toast.error('Failed to analyze risk. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null);
  };

  const inputFields = [
    { id: 'Glucose', label: 'Glucose', type: 'number', min: 0, max: 300, hint: 'Plasma glucose concentration', tooltip: 'A 2-hour oral glucose tolerance test.' },
    { id: 'BloodPressure', label: 'Blood Pressure', type: 'number', min: 0, max: 200, hint: 'Diastolic blood pressure (mm Hg)', tooltip: 'Normal is around 80 mm Hg.' },
    { id: 'Insulin', label: 'Insulin', type: 'number', min: 0, max: 900, hint: '2-Hour serum insulin (mu U/ml)', tooltip: 'Measures how well the body processes sugar.' },
    { id: 'BMI', label: 'BMI', type: 'number', step: '0.1', min: 0, max: 70, hint: 'Body mass index (weight/height^2)', tooltip: 'Over 30 is considered obese.' },
    { id: 'DiabetesPedigreeFunction', label: 'Pedigree Function', type: 'number', step: '0.001', min: 0, max: 3, hint: 'Diabetes pedigree function', tooltip: 'Genetic influence score based on family history.' },
    { id: 'Age', label: 'Age', type: 'number', min: 18, max: 120, hint: 'Age in years', tooltip: 'Risk typically increases with age.' },
  ];

  const referenceRanges = [
    { feature: 'Glucose', normal: '< 140 mg/dL', elevated: '140 - 199', high: '>= 200' },
    { feature: 'Blood Pressure', normal: '60 - 80 mmHg', elevated: '81 - 90', high: '> 90' },
    { feature: 'Insulin', normal: '~ 2 - 25 mU/ml', elevated: '25 - 200', high: '>= 200' },
    { feature: 'BMI', normal: '18.5 - 24.9', elevated: '25 - 29.9', high: '>= 30' },
    { feature: 'Pedigree Function', normal: '< 0.5', elevated: '0.5 - 1.0', high: '> 1.0' },
    { feature: 'Age', normal: '< 45', elevated: '45 - 60', high: '> 60' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diabetes Risk Analysis</h1>
          <p className="text-gray-500">Enter patient clinical data for AI-powered risk assessment.</p>
        </div>
        <button 
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCcw className="h-4 w-4" /> Reset Form
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 xl:col-span-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {referenceRanges.map((r) => (
                <div key={r.feature} className="rounded-xl border border-gray-100 bg-gradient-to-tr from-white to-gray-50 p-3 text-sm">
                  <div className="font-bold text-gray-800">{r.feature}</div>
                  <div className="text-[12px] text-gray-500">Normal: <span className="font-medium text-green-600">{r.normal}</span></div>
                  <div className="text-[12px] text-gray-500">Elevated: <span className="font-medium text-amber-600">{r.elevated}</span></div>
                  <div className="text-[12px] text-gray-500">High: <span className="font-medium text-red-600">{r.high}</span></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {inputFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={field.id} className="text-sm font-bold text-gray-700">
                      {field.label}
                    </label>
                    <div className="group relative">
                      <Info className="h-4 w-4 text-gray-300 cursor-help transition-colors hover:text-blue-500" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 rounded-xl bg-gray-900 p-3 text-xs text-white shadow-2xl z-20 leading-relaxed">
                        {field.tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      id={field.id}
                      type={field.type}
                      step={field.step || '1'}
                      {...register(field.id as keyof PredictionFormData, { 
                        required: 'Required',
                        min: { value: field.min, message: `Min ${field.min}` },
                        max: { value: field.max, message: `Max ${field.max}` }
                      })}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-4",
                        errors[field.id as keyof PredictionFormData] 
                          ? "border-red-200 bg-red-50/30 focus:ring-red-100" 
                          : "border-gray-200 bg-gray-50/30 focus:border-blue-500 focus:ring-blue-50"
                      )}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">{field.hint}</p>
                    {errors[field.id as keyof PredictionFormData] && (
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
                        {errors[field.id as keyof PredictionFormData]?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCcw className="h-5 w-5 animate-spin" /> Analyzing Clinical Data...
                  </>
                ) : (
                  <>
                    Run Diagnostic Analysis <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl border border-gray-200 bg-white p-12 shadow-sm h-full flex flex-col items-center justify-center text-center"
              >
                <Loader />
                <div className="mt-8 space-y-2">
                  <h3 className="text-xl font-black text-gray-900">Processing Data</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">Our neural network is processing clinical markers to determine risk probability.</p>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 overflow-hidden h-full flex flex-col"
              >
                <div className={cn("p-8 border-b text-center", getRiskColor(result.risk_level))}>
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/50 backdrop-blur-sm mb-4">
                    {result.risk_level === 'High' ? <AlertCircle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">{result.risk_level} Risk Detected</h3>
                  <p className="mt-1 text-sm font-bold opacity-80 uppercase tracking-widest">Diagnostic Report</p>
                </div>
                
                <div className="p-8 space-y-8 flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-6">Confidence Score</p>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="h-40 w-40 transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          stroke="currentColor"
                          strokeWidth="14"
                          fill="transparent"
                          className="text-gray-50"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="72"
                          stroke="currentColor"
                          strokeWidth="14"
                          fill="transparent"
                          strokeDasharray={452.4}
                          strokeDashoffset={452.4 - (452.4 * result.probability)}
                          strokeLinecap="round"
                          className={cn(
                            "transition-all duration-1000 ease-out",
                            result.risk_level === 'High' ? 'text-red-500' : 
                            result.risk_level === 'Medium' ? 'text-amber-500' : 
                            'text-emerald-500'
                          )}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-black text-gray-900 tracking-tighter">
                          {(result.probability * 100).toFixed(0)}%
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Probability</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gray-50 p-5 border border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-900 mb-2 uppercase tracking-wider">
                        <BrainCircuit className="h-4 w-4 text-blue-600" /> AI Clinical Insights
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        Patient classification: <span className="font-bold text-gray-900 underline decoration-blue-500/30 decoration-2 underline-offset-2">{result.prediction}</span>. 
                        {result.risk_level === 'High' 
                          ? " Significant deviations in metabolic markers detected. Prioritize immediate follow-up diagnostic testing." 
                          : " Physiological markers are within standard deviations. Maintain current monitoring schedule."}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure Medical Analysis
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center h-full flex flex-col items-center justify-center bg-gray-50/30">
                <div className="h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                  <Activity className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Ready for Analysis</h3>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-[240px] mx-auto">Input clinical parameters to generate a comprehensive risk assessment report.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Health Recommendations Section */}
      {result && result.recommendations && result.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Personalized Health Recommendations</h2>
              <p className="text-sm text-gray-500 mt-1">AI-generated guidance based on your risk assessment</p>
            </div>
          </div>

          {/* Quick Actions */}
          {result.quickActions && result.quickActions.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-6 border border-blue-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" /> Quick Action Items
              </h3>
              <ul className="space-y-2">
                {result.quickActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                    <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={cn(
                  "rounded-2xl p-6 border-2 hover:shadow-lg transition-all duration-300",
                  rec.priority === "high"
                    ? "bg-red-50 border-red-200 hover:border-red-300"
                    : rec.priority === "medium"
                    ? "bg-amber-50 border-amber-200 hover:border-amber-300"
                    : "bg-emerald-50 border-emerald-200 hover:border-emerald-300"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      rec.priority === "high"
                        ? "bg-red-100 text-red-600"
                        : rec.priority === "medium"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                    )}
                  >
                    <Activity className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                      rec.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : rec.priority === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {rec.priority}
                  </span>
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{rec.message}</p>
                {rec.actionUrl && (
                  <button
                    className={cn(
                      "mt-4 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all",
                      rec.priority === "high"
                        ? "text-red-600"
                        : rec.priority === "medium"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    )}
                  >
                    Learn More <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Medical Disclaimer */}
          {result.metadata && (
            <div className="rounded-2xl bg-gray-50 p-6 border border-gray-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <p className="font-bold text-gray-900 mb-2">⚠️ IMPORTANT MEDICAL DISCLAIMER</p>
                  <p>
                    This tool provides an AI-based risk SCREENING only – NOT a medical diagnosis.
                    Results are from a machine learning model trained on PIMA Indian demographics.
                    ALWAYS consult a healthcare provider for confirmation and treatment decisions.
                    If your risk is "High" or "Very High", schedule an appointment with your doctor immediately.
                  </p>
                  <p className="mt-2 text-[10px] text-gray-400">
                    Generated: {new Date(result.metadata.generatedAt).toLocaleString()} • Version: {result.metadata.disclaimerVersion}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Prediction;
