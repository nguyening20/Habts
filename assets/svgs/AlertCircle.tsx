import React from 'react';
import { SvgXml } from 'react-native-svg';
import { View } from 'react-native';

const alert = (strokeOutlineColor: string) => `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
<path d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z" stroke="${strokeOutlineColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 6.66699V10.0003" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 13.333H10.0088" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

interface Props {
    strokeColor: string;
    fillColor: string;
    strokeOutlineColor: string;
}

class AlertCircle extends React.Component<Props, {}> {
    render() {
        const customAlert = alert(this.props.strokeOutlineColor);

        return (
            <SvgXml xml={customAlert} width='100%' height='100%' stroke={this.props.strokeColor} fill={this.props.fillColor} />
        )
    }
}

export default AlertCircle