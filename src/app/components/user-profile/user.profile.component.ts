import { Component, ViewChild, OnInit } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators,
  ValidationErrors, 
  ValidatorFn, 
  AbstractControl
} from '@angular/forms';

import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { UserResponse } from '../../responses/user/user.response';
import { UpdateUserDTO } from '../../dtos/user/update.user.dto';

import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'user-profile',
  templateUrl: './user.profile.component.html',
  styleUrls: ['./user.profile.component.scss'],
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule,
    FormsModule, 
    ReactiveFormsModule,   
  ],
})
export class UserProfileComponent implements OnInit {
  userResponse?: UserResponse;
  userProfileForm: FormGroup;
  token:string = '';
  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private tokenService: TokenService,
  ){        
    this.userProfileForm = this.formBuilder.group({
      fullname: ['',[Validators.required,Validators.minLength(5)]],     
      address: ['',[Validators.minLength(10)]],       
      password: ['', [Validators.minLength(6)]], 
      retype_password: ['', [Validators.minLength(6)]], 
      date_of_birth: [Date.now()],      
    }, {
      validators: this.passwordMatchValidator// Custom validator function for password match
    });
  }
  
  ngOnInit(): void {  
    debugger
    this.token = this.tokenService.getToken();
    this.userService.getUserDetail(this.token).subscribe({
      next: (response: any) => {
        debugger
        this.userResponse = {
          ...response,
          date_of_birth: new Date(response.date_of_birth),
        };    
        this.userProfileForm.patchValue({
          fullname: this.userResponse?.fullname ?? '',
          address: this.userResponse?.address ?? '',
          date_of_birth: this.userResponse?.date_of_birth.toISOString().substring(0, 10),
        });        
        this.userService.saveUserResponseToLocalStorage(this.userResponse);         
      },
      complete: () => {
        debugger;
      },
      error: (error: HttpErrorResponse) => {
        debugger;
        console.error(error?.error?.message ?? '');
      }
    })
  }
  // passwordMatchValidator(): ValidatorFn {
  //   return (formGroup: AbstractControl): ValidationErrors | null => {
  //     const password = formGroup.get('password')?.value;
  //     const retypedPassword = formGroup.get('retype_password')?.value;
  //     if (!password || !retypedPassword) {
  //       return null;
  //     }
  //     if (password !== retypedPassword) {
  //       return { passwordMismatch: true };
  //     }
  //     return null;
  //   };
  // }
  passwordMatchValidator: ValidatorFn = (formGroup: AbstractControl): ValidationErrors | null => {
    const password = formGroup.get('password')?.value;
    const retypedPassword = formGroup.get('retype_password')?.value;

    if (!password || !retypedPassword) {
      return null;
    }

    if (password !== retypedPassword) {
      return { passwordMismatch: true };
    }

    return null;
  };
  save(): void {
    debugger
    if (this.userProfileForm.valid) {
      const updateUserDTO: UpdateUserDTO = {
        fullname: this.userProfileForm.get('fullname')?.value,
        address: this.userProfileForm.get('address')?.value,
        password: this.userProfileForm.get('password')?.value,
        retype_password: this.userProfileForm.get('retype_password')?.value,
        date_of_birth: this.userProfileForm.get('date_of_birth')?.value
      };
  
      this.userService.updateUserDetail(this.token, updateUserDTO)
        .subscribe({
          next: (response: any) => {
            this.userService.removeUserFromLocalStorage();
            this.tokenService.removeToken();
            alert("Update account succesfully !!");
            this.router.navigate(['/login']);
          },
          error: (error: HttpErrorResponse) => {
            debugger;
            console.error(error?.error?.message ?? '');
            alert("Lost information !!" + error?.error?.message ?? ' ');
          } 
        });
    } else {
      if (this.userProfileForm.hasError('passwordMismatch')) {        
        console.error("Two passwords don't match together");
        alert("Two passwords don't match together");
      }
    }
  }    
}

