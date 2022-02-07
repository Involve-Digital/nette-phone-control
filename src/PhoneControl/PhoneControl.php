<?php declare(strict_types=1);

namespace Involve\Forms\Controls;

use Exception;
use libphonenumber\PhoneNumberUtil;
use Nette\Forms\Container;
use Nette\Forms\Controls\HiddenField;
use Nette\Forms\Controls\TextInput;
use Nette\Forms\Form;
use Nette\Utils\Html;
use Nette\Utils\Json;
use Nette\Utils\Strings;

class PhoneControl extends TextInput
{

    public const OUTPUT_FORMAT_PHONENUMBER_OBJECT = -3;
    public const OUTPUT_FORMAT_GET_NATIONAL_NUMBER = -2;
    public const OUTPUT_FORMAT_RAW = -1;

    public const DEFAULT_REGEX = '^[+]?[0-9 ()-]*$';

    public const NUMBER_VALIDATOR = self::class . '::validateNumber';

    /** @var array */
    protected $allowedRegions;

    /** @var array */
    protected $expectedRegions;

    /** @var int */
    protected $outputFormat;

    /** @var bool */
    protected $outputFormatWhitespaces;

    //////////////////////////////////////////////////////// Setup

    /** @param $allowedRegions string|array */
    public function setAllowedRegions($allowedRegions): self
    {
        $allowedRegions = (array)$allowedRegions;

        $this->validateRegions($allowedRegions);

        $this->expectedRegions = $allowedRegions;
        $this->allowedRegions = $allowedRegions;

        return $this;
    }

    /** @param $allowedCountries string|array */
    public function setExpectedRegions($expectedRegions): self
    {
        $expectedRegions = (array)$expectedRegions;

        $this->validateRegions($expectedRegions);

        $this->expectedRegions = (array)$expectedRegions;

        return $this;
    }

    public function setOutputFormat(int $outputFormat): self
    {
        $this->outputFormat = $outputFormat;

        return $this;
    }

    public function setOutputFormatWhitespaces(bool $whitespaces): self
    {
        $this->outputFormatWhitespaces = $whitespaces;

        return $this;
    }

    //////////////////////////////////////////////////////// Validations

    public static function validateNumber(PhoneControl $control): bool
    {
        if (!$control->value && !$control->isRequired()) {
            return true;
        }

        if (!self::validateAllowedRegions($control)) {
            return false;
        }

        $phoneNumberUtil = PhoneNumberUtil::getInstance();

        try {
            $phoneNumber = $phoneNumberUtil->parse(
                self::getPhoneWithRegionCode($control)
            );

            return $phoneNumberUtil->isValidNumber($phoneNumber);
        } catch (Exception $e) {
            return false;
        }
    }

    public static function validateAllowedRegions(PhoneControl $control): bool
    {
        if (!$control->allowedRegions) {
            return true;
        }

        if (!$control->value && !$control->isRequired()) {
            return true;
        }

        $phoneNumberUtil = PhoneNumberUtil::getInstance();

        foreach ($control->allowedRegions as $region) {
            $phoneNumber = $phoneNumberUtil->parse(
                self::getPhoneWithRegionCode($control),
                $region
            );

            if ($phoneNumberUtil->isValidNumberForRegion($phoneNumber, $region)) {
                return true;
            }
        }

        return false;
    }

    /** @throws Exception */
    private function validateRegions(array $regions): void
    {
        foreach ($regions as $region) {
            if (!isset(RegionCodes::CODES[$region])) {
                throw new Exception("Region {$region} is not supported.");
            }
        }
    }

    public static function getPhoneWithRegionCode(PhoneControl $control): string
    {
        $phone = $control->value;

        if (Strings::contains($phone, '+')) {
            return $phone;
        }

        $name = $control->getName();

        while (!($control = $control->getParent()) instanceof Form) {
            $path[] = $control->getName();
        }

        $formHttpData = $control->getHttpData();

        if (isset($path)) {
            $path = array_reverse($path);

            foreach ($path as $pathPart) {
                $formHttpData = $formHttpData[$pathPart];
            }
        }

        $regionCode = $formHttpData[$name . 'RegionCode'] ?? null;

        return $regionCode . ' ' . $phone;
    }

    //////////////////////////////////////////////////////// Other

    public function getControl(): Html
    {
        $control = parent::getControl();

        $control->class[] = 'phone-control';

        if ($regionCodes = $this->getRegionCodes()) {
            $control->data('region-codes', Json::encode($regionCodes));
            $control->data('strict', (int)$this->allowedRegions);
        }

        return $control;
    }

    public function getValue()
    {
        if (!$this->value) {
            return null;
        }

        if ($this->outputFormat === self::OUTPUT_FORMAT_RAW) {
            $value = self::getPhoneWithRegionCode($this);

            if (!$this->outputFormatWhitespaces) {
                return preg_replace('/\s+/', '', $value);
            }

            return $value;
        }

        $phoneNumberUtil = PhoneNumberUtil::getInstance();

        try {
            $regions = $this->allowedRegions ?: $this->expectedRegions;

            foreach ($regions as $region) {
                $phoneNumber = $phoneNumberUtil->parse(self::getPhoneWithRegionCode($this), $region);

                if ($phoneNumberUtil->isValidNumberForRegion($phoneNumber, $region)) {
                    if ($this->outputFormat === self::OUTPUT_FORMAT_PHONENUMBER_OBJECT) {
                        return $phoneNumber;
                    }

                    if ($this->outputFormat === self::OUTPUT_FORMAT_GET_NATIONAL_NUMBER) {
                        $value = $phoneNumber->getNationalNumber();
                    } else {
                        $value = $phoneNumberUtil->format($phoneNumber, $this->outputFormat);
                    }

                    if (!$this->outputFormatWhitespaces) {
                        return preg_replace('/\s+/', '', $value);
                    }

                    return $value;
                }
            }

            $phoneNumber = $phoneNumberUtil->parse(self::getPhoneWithRegionCode($this));

            if ($this->outputFormat === self::OUTPUT_FORMAT_PHONENUMBER_OBJECT) {
                return $phoneNumber;
            }

            if ($this->outputFormat === self::OUTPUT_FORMAT_GET_NATIONAL_NUMBER) {
                $value = $phoneNumber->getNationalNumber();
            } else {
                $value = $phoneNumberUtil->format($phoneNumber, $this->outputFormat);
            }

            if (!$this->outputFormatWhitespaces) {
                return preg_replace('/\s+/', '', $value);
            }

            return $value;
        } catch (Exception $e) {
            return false;
        }
    }

    private function getRegionCodes(): array
    {
        $regions = $this->allowedRegions ?: $this->expectedRegions;
        $regionCodes = [];

        foreach ($regions as $region) {
            $regionCode = RegionCodes::CODES[$region];

            if (is_array($regionCode)) {
                $regionCodes = array_merge($regionCodes, $regionCode);
                continue;
            }

            $regionCodes[$region] = RegionCodes::CODES[$region];
        }

        return $regionCodes;
    }

    //////////////////////////////////////////////////////// DI

    public static function register(
        $allowedRegions,
        $expectedRegions,
        $outputFormat,
        $regex
    ): void
    {
        Container::extensionMethod('addPhone', function (
            $container,
            $name,
            $label = NULL,
            int $maxLength = NULL
        ) use (
            $allowedRegions,
            $expectedRegions,
            $outputFormat,
            $regex
        ): PhoneControl {
            $input = $container[$name] = new PhoneControl($label, $maxLength);

            $input->setAllowedRegions($allowedRegions);
            $input->setExpectedRegions($allowedRegions ?: $expectedRegions);
            $input->setOutputFormat((int)$outputFormat);

            $input->addRule(self::NUMBER_VALIDATOR, 'Phone number is not valid.');

            if ($regex && is_string($regex)) {
                $input->addRule(Form::PATTERN, 'Phone number is not valid.', $regex);
            }

            $container[$name . 'RegionCode'] = new HiddenField;

            return $input;
        });
    }

}
