import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { AppDispatch } from "./../store";
import { confirmCalendar } from "./../actions/calendarActions"; // новый экшен для подтверждения календаря
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function ConfirmCalendar() {
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useParams<{ token: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const confirm = async () => {
      try {
        if (token) {
          await dispatch(confirmCalendar(token));
          setMessage("You have successfully joined the calendar!");
          setIsSuccess(true);
        }
      } catch (err: any) {
        setMessage(
          "An error occurred during calendar confirmation. Please try again or contact support."
        );
        setIsSuccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    confirm();
  }, [dispatch, token]);

  const handleConfirm = () => {
    navigate("/calendars"); // Направляем пользователя на страницу с календарями
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-100 pt-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">PlanQ</h1>
        <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
      </div>

      <Card className="w-[400px] shadow-xl bg-background/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <h2 className="text-2xl font-bold text-center text-blue-700">
            Calendar Confirmation
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {isLoading
              ? "Confirming your calendar membership..."
              : "Confirmation status"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex justify-center p-6 bg-background/50 rounded-full">
              {isLoading ? (
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500" />
              )}
            </div>

            {!isLoading && (
              <Alert
                variant={isSuccess ? "default" : "destructive"}
                className={`border-2 ${
                  isSuccess
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-red-500 bg-destructive/10"
                }`}
              >
                <AlertDescription className="text-center text-base">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {!isLoading && (
              <Button
                onClick={handleConfirm}
                className="w-full h-11"
                variant={isSuccess ? "default" : "secondary"}
              >
                <span className="flex items-center justify-center">
                  {isSuccess ? "Go to Calendars" : "Try Again"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConfirmCalendar;
