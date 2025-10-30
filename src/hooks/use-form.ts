import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { z } from "zod";

type ValidationErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
  validationSchema?: z.ZodType<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleBlur: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFormValues: (values: Partial<T>) => void;
  resetForm: () => void;
  setFieldError: <K extends keyof T>(field: K, error: string) => void;
  clearErrors: () => void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  validationSchema,
  validateOnChange = true,
  validateOnBlur = true,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [formValues, setFormValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(formValues);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors: ValidationErrors<T> = {};

        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            const field = err.path[0] as keyof T;
            formattedErrors[field] = err.message;
          }
        });

        setErrors(formattedErrors);
      }
      return false;
    }
  }, [formValues, validationSchema]);

  const validateField = useCallback(
    (name: keyof T, value: unknown): boolean => {
      if (!validationSchema) return true;

      try {
        const tempValues = { ...formValues, [name]: value };

        const result = validationSchema.safeParse(tempValues);

        if (result.success) {
          setErrors((prev) => {
            const updated = { ...prev };
            delete updated[name];
            return updated;
          });
          return true;
        } else {
          const fieldError = result.error.errors.find(
            (err) => err.path.length > 0 && err.path[0] === name
          );

          if (fieldError) {
            setErrors((prev) => ({
              ...prev,
              [name]: fieldError.message,
            }));
            return false;
          } else {
            setErrors((prev) => {
              const updated = { ...prev };
              delete updated[name];
              return updated;
            });
            return true;
          }
        }
      } catch (error) {
        console.error("Erro ao validar campo:", error);
        return false;
      }
    },
    [validationSchema, formValues]
  );

  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;

      let newValue: unknown = value;

      if (type === "checkbox") {
        newValue = (e.target as HTMLInputElement).checked;
      } else if (type === "number") {
        newValue = value === "" ? "" : Number(value);
      }

      setFormValues((prev) => ({ ...prev, [fieldName]: newValue }));

      if (validateOnChange && touched[fieldName]) {
        validateField(fieldName, newValue);
      }
    },
    [touched, validateField, validateOnChange]
  );

  const handleBlur = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const fieldName = e.target.name as keyof T;

      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      if (validateOnBlur) {
        validateField(fieldName, formValues[fieldName]);
      }
    },
    [validateField, validateOnBlur, formValues]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const allTouched = Object.keys(formValues).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);

      setTouched(allTouched);

      const isValid = validateForm();

      if (!isValid) {
        console.error("❌ Validação falhou. Erros:", errors);
      }

      if (isValid && onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(formValues);
        } catch (error) {
          console.error("Erro ao enviar formulário:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [formValues, validateForm, onSubmit, errors]
  );

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateValues = useCallback((newValues: Partial<T>) => {
    setFormValues((prev) => ({ ...prev, ...newValues }));
  }, []);
  const resetForm = useCallback(() => {
    setFormValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldError = useCallback(
    <K extends keyof T>(field: K, error: string) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values: formValues,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setFormValues: updateValues,
    resetForm,
    setFieldError,
    clearErrors,
  };
}
