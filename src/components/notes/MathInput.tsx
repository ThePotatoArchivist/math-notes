import { useEffect, useRef } from 'react';
import { Direction as MQDirection } from 'react-mathquill';
import { ControlledComponentProps, NavigationProps } from '../../data/props';
import '../../fixGlobal'; // Must be called before react-mathquill
import { EditableMathField, MathField, MathFieldConfig } from 'react-mathquill';
import '@edtr-io/mathquill/build/mathquill.css';
import './MathInput.css';

const MQDir = {
    left: -1 as MQDirection.L,
    right: 1 as MQDirection.R,
};

const mathquillConfigOptions: MathFieldConfig = {
    spaceBehavesLikeTab: true,
    autoCommands: 'sqrt nthroot pi tau theta langle rangle union intersection and or infinity infty int sum prod to implies iff equiv oplus neg not forall exists bar hat times text lambda',
    autoOperatorNames: 'log ln exp sin cos tan sec csc cot arcsin arccos arctan arcsec arccsc arccot sinh cosh tanh sech csch coth arcsinh arccosh arctanh arcsech arccsch arccoth lim Span Col Nul dim rank det adj mod div',
};

function MathInput({
    value,
    onChange,
    focused,
    focusSide,
    onFocus,
    onDownOut,
    onLeftOut,
    onRightOut,
    onUpOut,
    onInsertAfter,
    onDeleteOut,
}: ControlledComponentProps<string> & NavigationProps) {
    const mathFieldRef = useRef<MathField>();

    const supressEditEvent = useRef(import.meta.env.DEV ? 2 : 0); // EditableMathField has an effect which triggers the edit event at init

    // Update mathquill config
    useEffect(() => {
        mathFieldRef.current?.config({
            ...mathquillConfigOptions,
            handlers: {
                downOutOf: onDownOut,
                upOutOf: onUpOut,
                moveOutOf: direction => {
                    (direction === MQDir.right ? onRightOut : onLeftOut)?.();
                },
                edit: (mathfield: MathField) => {
                    const latex = mathfield.latex();
                    if (supressEditEvent.current > 0) {
                        supressEditEvent.current--;
                    } else {
                        onChange(latex);
                    }
                },
                enter: onInsertAfter,
                deleteOutOf: () => {
                    supressEditEvent.current = 1; // edit is triggered at the same time as deleteOutOf
                    onDeleteOut?.();
                },
            },
        });
    }, [
        onChange,
        onDeleteOut,
        onDownOut,
        onInsertAfter,
        onLeftOut,
        onRightOut,
        onUpOut,
    ]);

    const handleMount = (mathfield: MathField) => {
        mathFieldRef.current = mathfield;
    };

    // Handle focusing
    useEffect(() => {
        if (focused) {
            mathFieldRef.current?.focus();
            if (focusSide === 'left') mathFieldRef.current?.moveToLeftEnd();
            if (focusSide === 'right') mathFieldRef.current?.moveToRightEnd();
        }
    }, [focusSide, focused]);

    return (
        <EditableMathField
            mathquillDidMount={handleMount}
            latex={value}
            config={mathquillConfigOptions}
            onFocus={onFocus}
        />
    );
}

export default MathInput;
