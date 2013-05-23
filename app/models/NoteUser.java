package models;

import java.util.*;
import javax.persistence.*;

import org.mindrot.jbcrypt.BCrypt;

import play.db.jpa.*;
import play.data.validation.*;

import play.modules.morphia.Model;
import com.google.code.morphia.annotations.Entity;

@com.google.code.morphia.annotations.Entity
public class NoteUser extends Model {

	
	public String username;
	
	@Password
	public String password;
	
	
	public String email;
	
	public String fullname;
	
	public boolean isAdmin;
	
	public boolean hasChangedPassword;
	
	public NoteUser(String username, String password, String email, String fullname, boolean isadmin, boolean haschangedpassword)
	{
		this.username = username;
		this.password = BCrypt.hashpw(password, BCrypt.gensalt());	//10 rounds by default
		this.email = email;
		this.fullname = fullname;
		this.isAdmin = isadmin;
		this.hasChangedPassword = haschangedpassword;
	}
	
	@Override
	public String toString()
	{
		return this.fullname;
	}
	
	public void setPassword(String password) {
		if(password.startsWith("$2a$") == false)	// don't re-hash hashed passwords or we'll never get in!
		{
			this.password = BCrypt.hashpw(password, BCrypt.gensalt());	//10 rounds by default
		}
	}
}
