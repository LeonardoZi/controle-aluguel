// Hook de Formulário
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

  // Validar todos os campos
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

  // Validar um único campo
  const validateField = useCallback(
    (name: keyof T, value: unknown): boolean => {
      if (!validationSchema) return true;

      try {
        // Criar um objeto temporário com todos os valores atuais
        const tempValues = { ...formValues, [name]: value };

        // Usar safeParse para validar o objeto completo
        const result = validationSchema.safeParse(tempValues);

        if (result.success) {
          // Se validou com sucesso, remover qualquer erro anterior deste campo
          setErrors((prev) => {
            const updated = { ...prev };
            delete updated[name];
            return updated;
          });
          return true;
        } else {
          // Procurar por erros específicos para este campo
          const fieldError = result.error.errors.find(
            (err) => err.path.length > 0 && err.path[0] === name
          );

          if (fieldError) {
            // Atualizar apenas o erro deste campo
            setErrors((prev) => ({
              ...prev,
              [name]: fieldError.message,
            }));
            return false;
          } else {
            // Não há erro para este campo específico
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

  // Manipular mudanças em campos
  const handleChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;

      let newValue: unknown = value;

      // Converter valor com base no tipo do campo
      if (type === "checkbox") {
        newValue = (e.target as HTMLInputElement).checked;
      } else if (type === "number") {
        newValue = value === "" ? "" : Number(value);
      }

      setFormValues((prev) => ({ ...prev, [fieldName]: newValue }));

      // Validar no onChange se configurado
      if (validateOnChange && touched[fieldName]) {
        validateField(fieldName, newValue);
      }
    },
    [touched, validateField, validateOnChange]
  );

  // Manipular evento de blur (perda de foco)
  const handleBlur = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const fieldName = e.target.name as keyof T;

      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      // Validar no onBlur se configurado
      if (validateOnBlur) {
        validateField(fieldName, formValues[fieldName]);
      }
    },
    [validateField, validateOnBlur, formValues]
  );

  // Manipular envio do formulário
  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Marcar todos os campos como tocados
      const allTouched = Object.keys(formValues).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);

      setTouched(allTouched);

      // Validar formulário antes de enviar
      const isValid = validateForm();

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
    [formValues, validateForm, onSubmit]
  );

  // Definir valor de um campo específico
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Definir múltiplos valores
  const updateValues = useCallback((newValues: Partial<T>) => {
    setFormValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Resetar formulário
  const resetForm = useCallback(() => {
    setFormValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Definir erro para um campo
  const setFieldError = useCallback(
    <K extends keyof T>(field: K, error: string) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    []
  );

  // Limpar todos os erros
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
