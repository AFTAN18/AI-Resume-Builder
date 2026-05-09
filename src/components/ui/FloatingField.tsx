import { Check } from 'lucide-react';
import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BaseProps = {
  label: string;
  error?: string;
  className?: string;
};

type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false;
  };

type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true;
  };

export function FloatingField(props: InputProps | TextareaProps) {
  const { label, error, className, multiline, ...fieldProps } = props;

  return (
    <div className={cn('floating-field', error && 'field-error', className)}>
      {multiline ? (
        <textarea placeholder=" " aria-label={label} {...(fieldProps as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input placeholder=" " aria-label={label} {...(fieldProps as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      <label>{label}</label>
      {!error && <Check className="valid-mark h-4 w-4" />}
      {error && <p className="mt-1 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}
