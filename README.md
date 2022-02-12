Phone control: final solution for validating phone numbers in Nette forms
==========================================

Introduction
------------

InvolveDigital brings you complete solution for phone numbers in Nette forms. Features include:

- validation via "giggsey/libphonenumber-for-php" library for backend and "libphonenumber-js" library for frontend
- freedom of phone number format on input
- unification of phone number format in output
- complete region codes solution

Installation
------------

The recommended way to install is via Composer:

```
composer require involve-digital/phone-control
```

Minimal required PHP is 7.1 and Nette 2.4


Client-side support can be installed with npm or yarn:

```
npm install phone-control
```

Usage
-----

### Backend

#### Config

Register extension and configure in configuration files.
- in example you can see default configuration
- you don't have to configure, if you dont need anything different
```neon
extensions:
        forms.phoneControl: Involve\Forms\Controls\PhoneControl\DI\PhoneControlExtension
        
forms.phoneControl:
    allowedRegions: [] # only allowed regions
    expectedRegions: [CZ, SK] # regions that we expect will be typed, but other regions are not restricted
    outputFormat: constant(libphonenumber\PhoneNumberFormat::E164) # output format
    outputFormatWhitespaces: true # set to false, if you want to trim whitespaces in output phone number
    regex: constant(PhoneControl::DEFAULT_REGEX) # first degree of protection, you can specify your own regex here
```

<small>Note: in older Nette use `::constant()` instead of `constant()`</small>

Let's have number `+420 608 343 634` number as an example.
<br>
Allowed values for `outputFormat` field are:
<table>

<tr>
<th>Value</th>
<th>Logic</th>
<th>Output</th>
</tr>

<tr>
<td>libphonenumber\PhoneNumberFormat::E164</td>
<td>PhoneNumberUtil::format()</td>
<td>+420608343634</td>
</tr>

<tr>
<td>libphonenumber\PhoneNumberFormat::INTERNATIONAL</td>
<td>PhoneNumberUtil::format()</td>
<td>+420 608 343 634</td>
</tr>

<tr>
<td>libphonenumber\PhoneNumberFormat::NATIONAL</td>
<td>PhoneNumberUtil::format()</td>
<td>608 343 634</td>
</tr>

<tr>
<td>libphonenumber\PhoneNumberFormat::RFC3966</td>
<td>PhoneNumberUtil::format()</td>
<td>tel:+420-608-343-634</td>
</tr>

<tr>
<td>Involve\Forms\Controls\PhoneControl::OUTPUT_FORMAT_GET_NATIONAL_NUMBER</td>
<td>PhoneNumber::getNationalNumber()</td>
<td>608363903</td>
</tr>

<tr>
<td>Involve\Forms\Controls\PhoneControl::OUTPUT_FORMAT_RAW</td>
<td>---</td>
<td>value as it was typed in</td>
</tr>

<tr>
<td>Involve\Forms\Controls\PhoneControl::OUTPUT_FORMAT_PHONENUMBER_OBJECT</td>
<td>---</td>
<td>libphonenumber\PhoneNumber object</td>
</tr>

</table>

#### Nette form

```php
$form->addPhone('phone', 'Phone:')
    ->setAllowedRegions('CZ');
//  ->setExpectedRegions(string|array $expectedRegions)
//  ->setOutputFormat(int $outputFormat) - see table above
//  ->setOutputFormatWhitespaces(bool $whitespaces)
```

#### Without client-side script

You can definitely use this extension server side only. The user will be forced to write region code though, so you might want to leave that information somewhere near the input.

Alternatively you can preset default region code. This component essentially adds two inputs into form; `TextInput` for actual phone number and `HiddenInput` for region code, mainly used by client side script. You could use the hidden input for setting default region code:

```php
$form->addPhone('phone', 'Phone:')
    ->setAllowedRegions('CZ');

$form['phoneRegionCode']->setValue('+420'); // hidden input is created by adding postfix "RegionCode" to the name of the parent input
```

### Frontend

True beauty comes with the client side script. Script is dependent on `netteForms.js` library. Usage of `libphonenumber-js` library is optional as you can write your own validation without this library.

How does it work?
1. a dropdown is appended at the beginning of input
2. dropdown contains specified countries/regions options
3. on select, region code value is saved to hidden input
4. on select of option "other", additional input for other region code is added
5. on typed "+" sign in phone input, dropdown is hidden as it is pressumed, that user will enter region code number in main imput

```html
<script src="netteForms.js"></script>
<script src="phone-control.js"></script>
```

Global object `Nette` is updated and `Nette.PhoneControl` object is created, where all functionality resides.

There are some options, that you can modify.

#### Config

```html
<script>
    Nette.PhoneControl.options = {
        'flag': true, // shows country flags in dropdown
        'otherText': '-jiné-', // you might want to pass translated text here
        'singleOptionPaddingOffset': 15, // padding-left of input that dropdown is in
        'multiOptionsPaddingOffset': 20, // padding-left of input that dropdown is in
        'dropdownChevronTopOffset': 8 // top offset of dropdown chevron icon
    };
</script>
```

#### Useful functions

You can validate control via `PhoneControl.validateControl` function:
```javascript
var valid = Nette.PhoneControl.validateControl(
  document.getElementById('test-phone-control')
);
```

You can also write your own validation:

```javascript
Nette.PhoneControl.validateControl = function (phoneControl) {
    //... your validation
  };
```

Input is validated autmatically when `Nette.validateForm()` is called (e.g. on submit). If you don't want that for some reason, you can unset validator:

```javascript
delete Nette.validators['InvolveFormsControlsPhoneControl_validateNumber'];
```

You might want to reinitialize phone control, espetially after snippet redrawal>
```javascript
$.nette.ajax({
  url: '...',
  complete: function () {
    Nette.PhoneControl.initControl(
      document.getElementById('test-phone-control')
    );
  }
});
```

#### CSS

Current CSS is ready for Bootstrap framework, there is high probability, that you'll have to do some CSS adjustments in your projects for this component to work. You can also style the component from scratch.
<br>
Please see `.css` and `.scss` file, copy contents to your project and modify as needed.

Most important styles to be modified are:

```css
/* positioning of dropdown in input */
.phone-control-region-code {
    margin-top: 8px !important;
    margin-left: 10px !important;
}

/* hover over dropdown options */
.phone-control-region-code li:not(:first-child):hover {
    background-color: rgb(184, 233, 134) !important;
    color: white;
}

/* input for other region code */
.phone-control-region-code li.phone-control-selected input[type="tel"] {
    height: 16px !important;
    width: 30px !important;
}
```
