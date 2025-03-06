<?php

// src/Config/TextAlign.php
namespace App\Config;

enum PatchNoteImportance: string
{
    case Minor = 'minor';
    case Major = 'major';
    case Hotfix = 'hotfix';
}


?>