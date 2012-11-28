package models;

import java.util.*;
import javax.persistence.*;

import play.modules.morphia.Model;
import com.google.code.morphia.annotations.Entity;

import play.data.validation.*;

@com.google.code.morphia.annotations.Entity
public class Note extends Model
{
	
	public String Body;
	public String Owner;

	public Note(String body, String owner)
	{
		this.Body = body;
		this.Owner = owner;
	}

	public String toString()
	{
		return this.Body;
	}
}